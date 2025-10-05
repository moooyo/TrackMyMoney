package notification

import "context"

// Notifier defines the interface for notification providers
type Notifier interface {
	// Send sends a notification with title and message
	Send(ctx context.Context, config string, title string, message string) error
}
