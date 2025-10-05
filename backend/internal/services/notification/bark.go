package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// BarkNotifier sends notifications via Bark
type BarkNotifier struct {
	httpClient *http.Client
}

// NewBarkNotifier creates a new Bark notifier
func NewBarkNotifier() *BarkNotifier {
	return &BarkNotifier{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// BarkConfig represents Bark notification configuration
type BarkConfig struct {
	ServerURL string `json:"server_url"` // e.g., "https://api.day.app/your_device_key"
	DeviceKey string `json:"device_key"` // Optional if already in server_url
	Sound     string `json:"sound"`      // Optional notification sound
	Group     string `json:"group"`      // Optional notification group
}

// Send sends a notification via Bark
func (n *BarkNotifier) Send(ctx context.Context, configStr string, title string, message string) error {
	var config BarkConfig
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("failed to parse bark config: %w", err)
	}

	// Build URL
	var requestURL string
	if config.ServerURL != "" {
		requestURL = config.ServerURL
		// If device key is provided separately, append it
		if config.DeviceKey != "" && !strings.Contains(requestURL, config.DeviceKey) {
			requestURL = strings.TrimSuffix(requestURL, "/") + "/" + config.DeviceKey
		}
	} else if config.DeviceKey != "" {
		// Use default Bark server
		requestURL = fmt.Sprintf("https://api.day.app/%s", config.DeviceKey)
	} else {
		return fmt.Errorf("either server_url or device_key is required")
	}

	// Add title and message to URL
	requestURL = fmt.Sprintf("%s/%s/%s",
		strings.TrimSuffix(requestURL, "/"),
		url.PathEscape(title),
		url.PathEscape(message))

	// Add query parameters
	params := url.Values{}
	if config.Sound != "" {
		params.Add("sound", config.Sound)
	}
	if config.Group != "" {
		params.Add("group", config.Group)
	}

	if len(params) > 0 {
		requestURL = requestURL + "?" + params.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, "GET", requestURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := n.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bark API returned status %d", resp.StatusCode)
	}

	return nil
}
