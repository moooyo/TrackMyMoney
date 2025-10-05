package notification

import (
	"context"
	"fmt"

	"trackmymoney/internal/models"
)

// Service manages notification sending
type Service struct {
	notifiers map[models.NotificationChannel]Notifier
}

// NewService creates a new notification service
func NewService() *Service {
	return &Service{
		notifiers: map[models.NotificationChannel]Notifier{
			models.ChannelTelegramBot: NewTelegramNotifier(),
			models.ChannelBark:        NewBarkNotifier(),
			models.ChannelEmail:       NewEmailNotifier(),
		},
	}
}

// Send sends a notification using the specified channel
func (s *Service) Send(ctx context.Context, channel models.NotificationChannel, config string, title string, message string) error {
	notifier, exists := s.notifiers[channel]
	if !exists {
		return fmt.Errorf("unsupported notification channel: %s", channel)
	}

	return notifier.Send(ctx, config, title, message)
}

// SendNotification sends a notification using a Notification model
func (s *Service) SendNotification(ctx context.Context, notification *models.Notification, title string, message string) error {
	return s.Send(ctx, notification.Channel, notification.Config, title, message)
}
