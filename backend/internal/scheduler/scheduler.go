package scheduler

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
	"trackmymoney/pkg/logger"
)

// Scheduler manages scheduled jobs
type Scheduler struct {
	jobs           map[string]*ScheduledJob
	mu             sync.RWMutex
	ticker         *time.Ticker
	stopCh         chan struct{}
	checkInterval  time.Duration
	location       *time.Location
	running        bool
}

// ScheduledJob represents a job with its schedule
type ScheduledJob struct {
	Name     string
	Job      Job
	Schedule *CronSchedule
	NextRun  time.Time
	Enabled  bool
}

// Config holds scheduler configuration
type Config struct {
	Enabled       bool
	CheckInterval int    // in seconds
	Timezone      string
}

// New creates a new scheduler
func New(cfg Config) *Scheduler {
	location, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		logger.Warn("Failed to load timezone, using UTC", zap.String("timezone", cfg.Timezone), zap.Error(err))
		location = time.UTC
	}

	interval := time.Duration(cfg.CheckInterval) * time.Second
	if interval <= 0 {
		interval = 60 * time.Second // Default to 1 minute
	}

	return &Scheduler{
		jobs:          make(map[string]*ScheduledJob),
		stopCh:        make(chan struct{}),
		checkInterval: interval,
		location:      location,
	}
}

// AddJob adds a job to the scheduler
func (s *Scheduler) AddJob(name string, job Job, cronExpr string) error {
	schedule, err := ParseCron(cronExpr)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().In(s.location)
	s.jobs[name] = &ScheduledJob{
		Name:     name,
		Job:      job,
		Schedule: schedule,
		NextRun:  schedule.Next(now),
		Enabled:  true,
	}

	logger.Info("Job added to scheduler",
		zap.String("name", name),
		zap.String("cron", cronExpr),
		zap.Time("next_run", s.jobs[name].NextRun))

	return nil
}

// RemoveJob removes a job from the scheduler
func (s *Scheduler) RemoveJob(name string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.jobs, name)
	logger.Info("Job removed from scheduler", zap.String("name", name))
}

// EnableJob enables a job
func (s *Scheduler) EnableJob(name string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if job, exists := s.jobs[name]; exists {
		job.Enabled = true
		logger.Info("Job enabled", zap.String("name", name))
		return true
	}
	return false
}

// DisableJob disables a job
func (s *Scheduler) DisableJob(name string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if job, exists := s.jobs[name]; exists {
		job.Enabled = false
		logger.Info("Job disabled", zap.String("name", name))
		return true
	}
	return false
}

// GetJob returns a scheduled job by name
func (s *Scheduler) GetJob(name string) *ScheduledJob {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.jobs[name]
}

// GetAllJobs returns all scheduled jobs
func (s *Scheduler) GetAllJobs() map[string]*ScheduledJob {
	s.mu.RLock()
	defer s.mu.RUnlock()

	jobs := make(map[string]*ScheduledJob, len(s.jobs))
	for k, v := range s.jobs {
		jobs[k] = v
	}
	return jobs
}

// Start starts the scheduler
func (s *Scheduler) Start() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.ticker = time.NewTicker(s.checkInterval)
	s.mu.Unlock()

	logger.Info("Scheduler started", zap.Duration("check_interval", s.checkInterval))

	go func() {
		for {
			select {
			case <-s.ticker.C:
				s.checkAndRunJobs()
			case <-s.stopCh:
				logger.Info("Scheduler stopped")
				return
			}
		}
	}()
}

// Stop stops the scheduler
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	s.running = false
	close(s.stopCh)
	if s.ticker != nil {
		s.ticker.Stop()
	}
}

// checkAndRunJobs checks if any jobs need to be run
func (s *Scheduler) checkAndRunJobs() {
	now := time.Now().In(s.location)

	s.mu.RLock()
	jobsToRun := make([]*ScheduledJob, 0)
	for _, job := range s.jobs {
		if job.Enabled && !now.Before(job.NextRun) {
			jobsToRun = append(jobsToRun, job)
		}
	}
	s.mu.RUnlock()

	for _, job := range jobsToRun {
		s.runJob(job)
	}
}

// runJob runs a single job in a goroutine
func (s *Scheduler) runJob(scheduledJob *ScheduledJob) {
	go func() {
		logger.Info("Running scheduled job", zap.String("name", scheduledJob.Name))

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		startTime := time.Now()
		err := scheduledJob.Job.Execute(ctx)
		duration := time.Since(startTime)

		if err != nil {
			logger.Error("Job execution failed",
				zap.String("name", scheduledJob.Name),
				zap.Error(err),
				zap.Duration("duration", duration))
		} else {
			logger.Info("Job execution completed",
				zap.String("name", scheduledJob.Name),
				zap.Duration("duration", duration))
		}

		// Update next run time
		s.mu.Lock()
		if job, exists := s.jobs[scheduledJob.Name]; exists {
			job.NextRun = job.Schedule.Next(time.Now().In(s.location))
			logger.Debug("Next run scheduled",
				zap.String("name", scheduledJob.Name),
				zap.Time("next_run", job.NextRun))
		}
		s.mu.Unlock()
	}()
}

// TriggerJob manually triggers a job
func (s *Scheduler) TriggerJob(name string) error {
	s.mu.RLock()
	job, exists := s.jobs[name]
	s.mu.RUnlock()

	if !exists {
		return ErrJobNotFound
	}

	logger.Info("Manually triggering job", zap.String("name", name))
	s.runJob(job)
	return nil
}

// ErrJobNotFound is returned when a job is not found
var ErrJobNotFound = fmt.Errorf("job not found")
