package models

import "time"

// ScheduledJob represents a scheduled job configuration
type ScheduledJob struct {
	BaseModel
	Name        string     `gorm:"type:varchar(255);not null;uniqueIndex" json:"name"`
	Type        string     `gorm:"type:varchar(50);not null" json:"type"` // "snapshot", "notification", etc.
	Description string     `gorm:"type:text" json:"description"`
	Schedule    string     `gorm:"type:varchar(255);not null" json:"schedule"` // Cron expression
	Enabled     bool       `gorm:"default:true" json:"enabled"`
	LastRunAt   *time.Time `json:"last_run_at,omitempty"`
	NextRunAt   *time.Time `json:"next_run_at,omitempty"`
	Config      string     `gorm:"type:text" json:"config"` // JSON string of job-specific config
}

// TableName specifies the table name for ScheduledJob
func (ScheduledJob) TableName() string {
	return "scheduled_jobs"
}

// JobExecutionLog represents a job execution log
type JobExecutionLog struct {
	BaseModel
	JobName    string     `gorm:"type:varchar(255);not null;index" json:"job_name"`
	StartedAt  time.Time  `gorm:"not null" json:"started_at"`
	FinishedAt *time.Time `json:"finished_at,omitempty"`
	Status     string     `gorm:"type:varchar(50);not null" json:"status"` // "success", "failed", "running"
	ErrorMsg   string     `gorm:"type:text" json:"error_msg,omitempty"`
	Duration   int64      `json:"duration"` // Duration in milliseconds
}

// TableName specifies the table name for JobExecutionLog
func (JobExecutionLog) TableName() string {
	return "job_execution_logs"
}
