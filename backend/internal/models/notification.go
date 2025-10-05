package models

// NotificationChannel represents the notification channel type
type NotificationChannel string

const (
	ChannelBark         NotificationChannel = "bark"
	ChannelTelegramBot  NotificationChannel = "telegram_bot"
	ChannelEmail        NotificationChannel = "email"
)

// Notification represents a notification configuration
type Notification struct {
	BaseModel
	Name        string              `gorm:"type:varchar(255);not null" json:"name"`
	Channel     NotificationChannel `gorm:"type:varchar(50);not null" json:"channel"`
	Description string              `gorm:"type:text" json:"description"`
	Config      string              `gorm:"type:text;not null" json:"config"` // JSON string of channel config
	Schedule    string              `gorm:"type:varchar(255)" json:"schedule"` // Cron expression
	Enabled     bool                `gorm:"default:true" json:"enabled"`
}
