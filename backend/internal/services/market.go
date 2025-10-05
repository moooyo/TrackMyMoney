package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
)

// MarketServiceConfig holds configuration for the market service
type MarketServiceConfig struct {
	BaseURL    string
	Timeout    int
	MaxRetries int
}

// MarketService provides market data functionality
type MarketService struct {
	baseURL    string
	httpClient *http.Client
	maxRetries int
}

// ApiResponse represents the unified API response from Python service
type ApiResponse[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// NewMarketService creates a new market service instance
func NewMarketService(config MarketServiceConfig) *MarketService {
	return &MarketService{
		baseURL: config.BaseURL,
		httpClient: &http.Client{
			Timeout: time.Duration(config.Timeout) * time.Second,
		},
		maxRetries: config.MaxRetries,
	}
}

// GetQuote gets a real-time quote for a single symbol
func (s *MarketService) GetQuote(symbol string) (*models.Quote, error) {
	url := fmt.Sprintf("%s/api/market/quote/%s", s.baseURL, symbol)
	var response ApiResponse[models.Quote]

	err := s.doRequest("GET", url, nil, &response)
	if err != nil {
		return nil, err
	}

	if response.Code != 0 {
		return nil, fmt.Errorf("market service error: %s", response.Message)
	}

	return &response.Data, nil
}

// GetQuotes gets quotes for multiple symbols
func (s *MarketService) GetQuotes(symbols []string) (*models.QuotesResponse, error) {
	url := fmt.Sprintf("%s/api/market/quotes", s.baseURL)

	requestBody := models.QuotesRequest{
		Symbols: symbols,
	}

	var response ApiResponse[models.QuotesResponse]
	err := s.doRequest("POST", url, requestBody, &response)
	if err != nil {
		return nil, err
	}

	if response.Code != 0 {
		return nil, fmt.Errorf("market service error: %s", response.Message)
	}

	return &response.Data, nil
}

// GetHistory gets historical price data
func (s *MarketService) GetHistory(symbol, period, interval string) (*models.HistoryResponse, error) {
	url := fmt.Sprintf("%s/api/market/history/%s?period=%s&interval=%s", s.baseURL, symbol, period, interval)
	var response ApiResponse[models.HistoryResponse]

	err := s.doRequest("GET", url, nil, &response)
	if err != nil {
		return nil, err
	}

	if response.Code != 0 {
		return nil, fmt.Errorf("market service error: %s", response.Message)
	}

	return &response.Data, nil
}

// GetInfo gets basic information about a stock or crypto
func (s *MarketService) GetInfo(symbol string) (*models.InfoResponse, error) {
	url := fmt.Sprintf("%s/api/market/info/%s", s.baseURL, symbol)
	var response ApiResponse[models.InfoResponse]

	err := s.doRequest("GET", url, nil, &response)
	if err != nil {
		return nil, err
	}

	if response.Code != 0 {
		return nil, fmt.Errorf("market service error: %s", response.Message)
	}

	return &response.Data, nil
}

// Search searches for stocks or crypto
func (s *MarketService) Search(query string, limit int) (*models.SearchResponse, error) {
	url := fmt.Sprintf("%s/api/market/search?q=%s&limit=%d", s.baseURL, query, limit)
	var response ApiResponse[models.SearchResponse]

	err := s.doRequest("GET", url, nil, &response)
	if err != nil {
		return nil, err
	}

	if response.Code != 0 {
		return nil, fmt.Errorf("market service error: %s", response.Message)
	}

	return &response.Data, nil
}

// doRequest performs an HTTP request with retry logic
func (s *MarketService) doRequest(method, url string, body interface{}, result interface{}) error {
	var lastErr error

	for attempt := 0; attempt <= s.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			backoff := time.Duration(attempt*attempt) * time.Second
			logger.Debug(fmt.Sprintf("Retrying request (attempt %d/%d) after %v", attempt, s.maxRetries, backoff))
			time.Sleep(backoff)
		}

		err := s.executeRequest(method, url, body, result)
		if err == nil {
			return nil
		}

		lastErr = err
		logger.Warn(fmt.Sprintf("Request failed (attempt %d/%d): %v", attempt+1, s.maxRetries+1, err))
	}

	return fmt.Errorf("request failed after %d attempts: %w", s.maxRetries+1, lastErr)
}

// executeRequest executes a single HTTP request
func (s *MarketService) executeRequest(method, url string, body interface{}, result interface{}) error {
	var reqBody io.Reader

	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(respBody))
	}

	if err := json.Unmarshal(respBody, result); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return nil
}
