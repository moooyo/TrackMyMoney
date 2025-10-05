package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"net/smtp"
	"strings"
)

// EmailNotifier sends notifications via email
type EmailNotifier struct{}

// NewEmailNotifier creates a new email notifier
func NewEmailNotifier() *EmailNotifier {
	return &EmailNotifier{}
}

// EmailConfig represents email notification configuration
type EmailConfig struct {
	SMTPHost string `json:"smtp_host"` // e.g., "smtp.gmail.com"
	SMTPPort int    `json:"smtp_port"` // e.g., 587
	Username string `json:"username"`  // SMTP username
	Password string `json:"password"`  // SMTP password
	From     string `json:"from"`      // Sender email address
	To       string `json:"to"`        // Recipient email address (comma-separated for multiple)
}

// Send sends a notification via email
func (n *EmailNotifier) Send(ctx context.Context, configStr string, title string, message string) error {
	var config EmailConfig
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("failed to parse email config: %w", err)
	}

	if config.SMTPHost == "" {
		return fmt.Errorf("smtp_host is required")
	}
	if config.SMTPPort == 0 {
		return fmt.Errorf("smtp_port is required")
	}
	if config.Username == "" {
		return fmt.Errorf("username is required")
	}
	if config.Password == "" {
		return fmt.Errorf("password is required")
	}
	if config.From == "" {
		return fmt.Errorf("from is required")
	}
	if config.To == "" {
		return fmt.Errorf("to is required")
	}

	// Parse recipients
	recipients := strings.Split(config.To, ",")
	for i := range recipients {
		recipients[i] = strings.TrimSpace(recipients[i])
	}

	// Build email message
	subject := fmt.Sprintf("Subject: %s\r\n", title)
	mime := "MIME-version: 1.0;\r\nContent-Type: text/plain; charset=\"UTF-8\";\r\n\r\n"
	body := message
	msg := []byte(subject + mime + body)

	// Setup authentication
	auth := smtp.PlainAuth("", config.Username, config.Password, config.SMTPHost)

	// Send email
	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)
	err := smtp.SendMail(addr, auth, config.From, recipients, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
