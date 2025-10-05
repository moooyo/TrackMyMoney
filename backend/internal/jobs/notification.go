package jobs

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/internal/scheduler"
	"trackmymoney/internal/services/notification"
	"trackmymoney/pkg/logger"
)

// NotificationDispatchJob sends notifications based on configuration
type NotificationDispatchJob struct {
	notificationService *notification.Service
}

// NewNotificationDispatchJob creates a new notification dispatch job
func NewNotificationDispatchJob(notificationService *notification.Service) *NotificationDispatchJob {
	return &NotificationDispatchJob{
		notificationService: notificationService,
	}
}

// Name returns the job name
func (j *NotificationDispatchJob) Name() string {
	return "notification_dispatch"
}

// Execute runs the job
func (j *NotificationDispatchJob) Execute(ctx context.Context) error {
	logger.Debug("Starting notification dispatch job")
	db := database.GetDB()

	// Get all enabled notifications
	var notifications []models.Notification
	if err := db.Where("enabled = ?", true).Find(&notifications).Error; err != nil {
		return fmt.Errorf("failed to fetch notifications: %w", err)
	}

	if len(notifications) == 0 {
		logger.Debug("No enabled notifications found")
		return nil
	}

	// Get current asset summary for notification content
	summary, err := j.getAssetSummary(ctx)
	if err != nil {
		return fmt.Errorf("failed to get asset summary: %w", err)
	}

	sentCount := 0
	now := time.Now()

	// Process each notification
	for _, notif := range notifications {
		// Check if this notification should be sent now
		shouldSend, err := j.shouldSendNow(notif.Schedule, now)
		if err != nil {
			logger.Warn("Failed to parse notification schedule",
				zap.Uint("notification_id", notif.ID),
				zap.String("schedule", notif.Schedule),
				zap.Error(err))
			continue
		}

		if !shouldSend {
			continue
		}

		// Send notification
		title := "TrackMyMoney 资产报告"
		message := j.formatAssetSummary(summary)

		if err := j.notificationService.SendNotification(ctx, &notif, title, message); err != nil {
			logger.Error("Failed to send notification",
				zap.Uint("notification_id", notif.ID),
				zap.String("name", notif.Name),
				zap.String("channel", string(notif.Channel)),
				zap.Error(err))
			continue
		}

		logger.Info("Notification sent successfully",
			zap.Uint("notification_id", notif.ID),
			zap.String("name", notif.Name),
			zap.String("channel", string(notif.Channel)))
		sentCount++
	}

	logger.Info("Notification dispatch job completed",
		zap.Int("total_enabled", len(notifications)),
		zap.Int("sent", sentCount))

	return nil
}

// shouldSendNow checks if a notification should be sent based on its schedule
func (j *NotificationDispatchJob) shouldSendNow(scheduleExpr string, now time.Time) (bool, error) {
	if scheduleExpr == "" {
		// No schedule means send every time
		return true, nil
	}

	// Parse cron expression
	schedule, err := scheduler.ParseCron(scheduleExpr)
	if err != nil {
		return false, err
	}

	// Get the next scheduled time from 1 minute ago
	// If the next time is now (within the current minute), send it
	oneMinuteAgo := now.Add(-1 * time.Minute)
	nextRun := schedule.Next(oneMinuteAgo)

	// Check if nextRun is within the current minute
	currentMinute := now.Truncate(time.Minute)
	nextMinute := currentMinute.Add(time.Minute)

	return !nextRun.Before(currentMinute) && nextRun.Before(nextMinute), nil
}

// AssetSummaryData represents asset summary data
type AssetSummaryData struct {
	TotalAssets float64
	TotalDebt   float64
	NetAssets   float64
	Categories  map[string]float64
}

// getAssetSummary calculates current asset summary
func (j *NotificationDispatchJob) getAssetSummary(ctx context.Context) (*AssetSummaryData, error) {
	db := database.GetDB()
	summary := &AssetSummaryData{
		Categories: make(map[string]float64),
	}

	// Cash assets
	var cashAssets []models.CashAsset
	if err := db.Find(&cashAssets).Error; err != nil {
		return nil, err
	}
	for _, asset := range cashAssets {
		summary.TotalAssets += asset.Amount
		summary.Categories["现金"] += asset.Amount
	}

	// Interest-bearing assets
	var interestBearingAssets []models.InterestBearingAsset
	if err := db.Find(&interestBearingAssets).Error; err != nil {
		return nil, err
	}
	for _, asset := range interestBearingAssets {
		summary.TotalAssets += asset.Amount
		summary.Categories["计息资产"] += asset.Amount
	}

	// Stock assets
	var stockAssets []models.StockAsset
	if err := db.Find(&stockAssets).Error; err != nil {
		return nil, err
	}
	for _, asset := range stockAssets {
		value := asset.Quantity * asset.CurrentPrice
		if asset.CurrentPrice == 0 {
			value = asset.Quantity * asset.PurchasePrice
		}
		summary.TotalAssets += value
		summary.Categories["股票"] += value
	}

	// Crypto assets
	var cryptoAssets []models.CryptoAsset
	if err := db.Find(&cryptoAssets).Error; err != nil {
		return nil, err
	}
	for _, asset := range cryptoAssets {
		value := asset.Quantity * asset.CurrentPrice
		if asset.CurrentPrice == 0 {
			value = asset.Quantity * asset.PurchasePrice
		}
		summary.TotalAssets += value
		summary.Categories["加密货币"] += value
	}

	// Debt assets
	var debtAssets []models.DebtAsset
	if err := db.Find(&debtAssets).Error; err != nil {
		return nil, err
	}
	for _, asset := range debtAssets {
		summary.TotalDebt += asset.Amount
		summary.Categories["债务"] += asset.Amount
	}

	summary.NetAssets = summary.TotalAssets - summary.TotalDebt

	return summary, nil
}

// formatAssetSummary formats asset summary as a message
func (j *NotificationDispatchJob) formatAssetSummary(summary *AssetSummaryData) string {
	msg := fmt.Sprintf("📊 资产概览 (截至 %s)\n\n", time.Now().Format("2006-01-02 15:04"))
	msg += fmt.Sprintf("💰 总资产: ¥%.2f\n", summary.TotalAssets)
	msg += fmt.Sprintf("💳 总负债: ¥%.2f\n", summary.TotalDebt)
	msg += fmt.Sprintf("📈 净资产: ¥%.2f\n\n", summary.NetAssets)

	if len(summary.Categories) > 0 {
		msg += "📁 分类明细:\n"
		for category, amount := range summary.Categories {
			if amount > 0 {
				percentage := (amount / summary.TotalAssets) * 100
				msg += fmt.Sprintf("  • %s: ¥%.2f (%.1f%%)\n", category, amount, percentage)
			}
		}
	}

	return msg
}
