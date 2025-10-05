package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/internal/scheduler"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

var globalScheduler *scheduler.Scheduler

// SetScheduler sets the global scheduler instance
func SetScheduler(s *scheduler.Scheduler) {
	globalScheduler = s
}

type CreateScheduledJobRequest struct {
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description"`
	Schedule    string `json:"schedule" binding:"required"`
	Enabled     *bool  `json:"enabled"`
	Config      string `json:"config"`
}

type UpdateScheduledJobRequest struct {
	Name        *string `json:"name"`
	Type        *string `json:"type"`
	Description *string `json:"description"`
	Schedule    *string `json:"schedule"`
	Enabled     *bool   `json:"enabled"`
	Config      *string `json:"config"`
}

// @Summary Create scheduled job
// @Description Create a new scheduled job
// @Tags jobs
// @Accept json
// @Produce json
// @Param job body CreateScheduledJobRequest true "Job info"
// @Success 200 {object} response.Response{data=models.ScheduledJob}
// @Router /api/jobs [post]
func CreateScheduledJob(c *gin.Context) {
	var req CreateScheduledJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	// Validate cron expression
	if _, err := scheduler.ParseCron(req.Schedule); err != nil {
		response.BadRequest(c, "Invalid cron expression: "+err.Error())
		return
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	job := models.ScheduledJob{
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		Schedule:    req.Schedule,
		Enabled:     enabled,
		Config:      req.Config,
	}

	db := database.GetDB()
	if err := db.Create(&job).Error; err != nil {
		logger.Error("Failed to create scheduled job", zap.Error(err))
		response.InternalError(c, "Failed to create scheduled job")
		return
	}

	logger.Info("Scheduled job created", zap.Uint("id", job.ID))
	response.Success(c, job)
}

// @Summary List scheduled jobs
// @Description Get all scheduled jobs
// @Tags jobs
// @Produce json
// @Success 200 {object} response.Response{data=[]models.ScheduledJob}
// @Router /api/jobs [get]
func GetScheduledJobs(c *gin.Context) {
	var jobs []models.ScheduledJob
	db := database.GetDB()

	if err := db.Order("created_at DESC").Find(&jobs).Error; err != nil {
		logger.Error("Failed to retrieve scheduled jobs", zap.Error(err))
		response.InternalError(c, "Failed to retrieve scheduled jobs")
		return
	}

	response.Success(c, jobs)
}

// @Summary Get scheduled job
// @Description Get a scheduled job by ID
// @Tags jobs
// @Produce json
// @Param id path int true "Job ID"
// @Success 200 {object} response.Response{data=models.ScheduledJob}
// @Router /api/jobs/{id} [get]
func GetScheduledJob(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid job ID")
		return
	}

	var job models.ScheduledJob
	db := database.GetDB()

	if err := db.First(&job, id).Error; err != nil {
		logger.Error("Scheduled job not found", zap.Error(err))
		response.NotFound(c, "Scheduled job not found")
		return
	}

	response.Success(c, job)
}

// @Summary Update scheduled job
// @Description Update a scheduled job
// @Tags jobs
// @Accept json
// @Produce json
// @Param id path int true "Job ID"
// @Param job body UpdateScheduledJobRequest true "Job info"
// @Success 200 {object} response.Response{data=models.ScheduledJob}
// @Router /api/jobs/{id} [put]
func UpdateScheduledJob(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid job ID")
		return
	}

	var req UpdateScheduledJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var job models.ScheduledJob

	if err := db.First(&job, id).Error; err != nil {
		logger.Error("Scheduled job not found", zap.Error(err))
		response.NotFound(c, "Scheduled job not found")
		return
	}

	if req.Name != nil {
		job.Name = *req.Name
	}
	if req.Type != nil {
		job.Type = *req.Type
	}
	if req.Description != nil {
		job.Description = *req.Description
	}
	if req.Schedule != nil {
		// Validate cron expression
		if _, err := scheduler.ParseCron(*req.Schedule); err != nil {
			response.BadRequest(c, "Invalid cron expression: "+err.Error())
			return
		}
		job.Schedule = *req.Schedule
	}
	if req.Enabled != nil {
		job.Enabled = *req.Enabled
	}
	if req.Config != nil {
		job.Config = *req.Config
	}

	if err := db.Save(&job).Error; err != nil {
		logger.Error("Failed to update scheduled job", zap.Error(err))
		response.InternalError(c, "Failed to update scheduled job")
		return
	}

	logger.Info("Scheduled job updated", zap.Uint("id", job.ID))
	response.Success(c, job)
}

// @Summary Delete scheduled job
// @Description Delete a scheduled job
// @Tags jobs
// @Param id path int true "Job ID"
// @Success 200 {object} response.Response
// @Router /api/jobs/{id} [delete]
func DeleteScheduledJob(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid job ID")
		return
	}

	db := database.GetDB()
	var job models.ScheduledJob

	if err := db.First(&job, id).Error; err != nil {
		logger.Error("Scheduled job not found", zap.Error(err))
		response.NotFound(c, "Scheduled job not found")
		return
	}

	if err := db.Delete(&job).Error; err != nil {
		logger.Error("Failed to delete scheduled job", zap.Error(err))
		response.InternalError(c, "Failed to delete scheduled job")
		return
	}

	logger.Info("Scheduled job deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Scheduled job deleted successfully"})
}

// @Summary Trigger scheduled job
// @Description Manually trigger a scheduled job
// @Tags jobs
// @Param id path int true "Job ID"
// @Success 200 {object} response.Response
// @Router /api/jobs/{id}/trigger [post]
func TriggerScheduledJob(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid job ID")
		return
	}

	db := database.GetDB()
	var job models.ScheduledJob

	if err := db.First(&job, id).Error; err != nil {
		logger.Error("Scheduled job not found", zap.Error(err))
		response.NotFound(c, "Scheduled job not found")
		return
	}

	if globalScheduler == nil {
		response.InternalError(c, "Scheduler not initialized")
		return
	}

	// Trigger the job by name
	if err := globalScheduler.TriggerJob(job.Name); err != nil {
		logger.Error("Failed to trigger job", zap.String("job_name", job.Name), zap.Error(err))
		response.InternalError(c, "Failed to trigger job: "+err.Error())
		return
	}

	// Update last run time
	now := time.Now()
	job.LastRunAt = &now
	db.Save(&job)

	logger.Info("Job triggered manually", zap.Uint("id", job.ID), zap.String("name", job.Name))
	response.Success(c, gin.H{"message": "Job triggered successfully"})
}

// @Summary Get job execution logs
// @Description Get execution logs for a scheduled job
// @Tags jobs
// @Produce json
// @Param job_name query string false "Filter by job name"
// @Param limit query int false "Limit results" default(50)
// @Success 200 {object} response.Response{data=[]models.JobExecutionLog}
// @Router /api/jobs/logs [get]
func GetJobExecutionLogs(c *gin.Context) {
	jobName := c.Query("job_name")
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	db := database.GetDB()
	query := db.Order("created_at DESC").Limit(limit)

	if jobName != "" {
		query = query.Where("job_name = ?", jobName)
	}

	var logs []models.JobExecutionLog
	if err := query.Find(&logs).Error; err != nil {
		logger.Error("Failed to retrieve job logs", zap.Error(err))
		response.InternalError(c, "Failed to retrieve job logs")
		return
	}

	response.Success(c, logs)
}
