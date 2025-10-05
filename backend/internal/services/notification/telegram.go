package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// TelegramNotifier sends notifications via Telegram Bot API
type TelegramNotifier struct {
	httpClient *http.Client
}

// NewTelegramNotifier creates a new Telegram notifier
func NewTelegramNotifier() *TelegramNotifier {
	return &TelegramNotifier{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// TelegramConfig represents Telegram notification configuration
type TelegramConfig struct {
	BotToken string `json:"bot_token"`
	ChatID   string `json:"chat_id"`
}

// Send sends a notification via Telegram
func (n *TelegramNotifier) Send(ctx context.Context, configStr string, title string, message string) error {
	var config TelegramConfig
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("failed to parse telegram config: %w", err)
	}

	if config.BotToken == "" {
		return fmt.Errorf("bot_token is required")
	}
	if config.ChatID == "" {
		return fmt.Errorf("chat_id is required")
	}

	// Combine title and message
	text := fmt.Sprintf("<b>%s</b>\n\n%s", title, message)

	// Prepare request
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", config.BotToken)
	payload := map[string]interface{}{
		"chat_id":    config.ChatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := n.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned status %d", resp.StatusCode)
	}

	return nil
}
