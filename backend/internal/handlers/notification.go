package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

type CreateNotificationRequest struct {
	Name        string                       `json:"name" binding:"required"`
	Channel     models.NotificationChannel   `json:"channel" binding:"required"`
	Description string                       `json:"description"`
	Config      string                       `json:"config" binding:"required"`
	Schedule    string                       `json:"schedule"`
	Enabled     *bool                        `json:"enabled"`
}

type UpdateNotificationRequest struct {
	Name        *string                      `json:"name"`
	Channel     *models.NotificationChannel  `json:"channel"`
	Description *string                      `json:"description"`
	Config      *string                      `json:"config"`
	Schedule    *string                      `json:"schedule"`
	Enabled     *bool                        `json:"enabled"`
}

// @Summary Create notification
// @Description Create a new notification configuration
// @Tags notifications
// @Accept json
// @Produce json
// @Param notification body CreateNotificationRequest true "Notification info"
// @Success 200 {object} response.Response{data=models.Notification}
// @Router /api/notifications [post]
func CreateNotification(c *gin.Context) {
	var req CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	notification := models.Notification{
		Name:        req.Name,
		Channel:     req.Channel,
		Description: req.Description,
		Config:      req.Config,
		Schedule:    req.Schedule,
		Enabled:     enabled,
	}

	db := database.GetDB()
	if err := db.Create(&notification).Error; err != nil {
		logger.Error("Failed to create notification", zap.Error(err))
		response.InternalError(c, "Failed to create notification")
		return
	}

	logger.Info("Notification created", zap.Uint("id", notification.ID))
	response.Success(c, notification)
}

// @Summary List notifications
// @Description Get all notification configurations
// @Tags notifications
// @Produce json
// @Success 200 {object} response.Response{data=[]models.Notification}
// @Router /api/notifications [get]
func GetNotifications(c *gin.Context) {
	var notifications []models.Notification
	db := database.GetDB()

	if err := db.Find(&notifications).Error; err != nil {
		logger.Error("Failed to retrieve notifications", zap.Error(err))
		response.InternalError(c, "Failed to retrieve notifications")
		return
	}

	response.Success(c, notifications)
}

// @Summary Get notification
// @Description Get a notification configuration by ID
// @Tags notifications
// @Produce json
// @Param id path int true "Notification ID"
// @Success 200 {object} response.Response{data=models.Notification}
// @Router /api/notifications/{id} [get]
func GetNotification(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid notification ID")
		return
	}

	var notification models.Notification
	db := database.GetDB()

	if err := db.First(&notification, id).Error; err != nil {
		logger.Error("Notification not found", zap.Error(err))
		response.NotFound(c, "Notification not found")
		return
	}

	response.Success(c, notification)
}

// @Summary Update notification
// @Description Update a notification configuration
// @Tags notifications
// @Accept json
// @Produce json
// @Param id path int true "Notification ID"
// @Param notification body UpdateNotificationRequest true "Notification info"
// @Success 200 {object} response.Response{data=models.Notification}
// @Router /api/notifications/{id} [put]
func UpdateNotification(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid notification ID")
		return
	}

	var req UpdateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var notification models.Notification

	if err := db.First(&notification, id).Error; err != nil {
		logger.Error("Notification not found", zap.Error(err))
		response.NotFound(c, "Notification not found")
		return
	}

	if req.Name != nil {
		notification.Name = *req.Name
	}
	if req.Channel != nil {
		notification.Channel = *req.Channel
	}
	if req.Description != nil {
		notification.Description = *req.Description
	}
	if req.Config != nil {
		notification.Config = *req.Config
	}
	if req.Schedule != nil {
		notification.Schedule = *req.Schedule
	}
	if req.Enabled != nil {
		notification.Enabled = *req.Enabled
	}

	if err := db.Save(&notification).Error; err != nil {
		logger.Error("Failed to update notification", zap.Error(err))
		response.InternalError(c, "Failed to update notification")
		return
	}

	logger.Info("Notification updated", zap.Uint("id", notification.ID))
	response.Success(c, notification)
}

// @Summary Delete notification
// @Description Delete a notification configuration
// @Tags notifications
// @Param id path int true "Notification ID"
// @Success 200 {object} response.Response
// @Router /api/notifications/{id} [delete]
func DeleteNotification(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid notification ID")
		return
	}

	db := database.GetDB()
	var notification models.Notification

	if err := db.First(&notification, id).Error; err != nil {
		logger.Error("Notification not found", zap.Error(err))
		response.NotFound(c, "Notification not found")
		return
	}

	if err := db.Delete(&notification).Error; err != nil {
		logger.Error("Failed to delete notification", zap.Error(err))
		response.InternalError(c, "Failed to delete notification")
		return
	}

	logger.Info("Notification deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Notification deleted successfully"})
}
