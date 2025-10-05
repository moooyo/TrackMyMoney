package models

// Quote represents a single stock or crypto quote
type Quote struct {
	Symbol        string  `json:"symbol"`
	Name          *string `json:"name,omitempty"`
	Price         *float64 `json:"price,omitempty"`
	PreviousClose *float64 `json:"previous_close,omitempty"`
	Change        *float64 `json:"change,omitempty"`
	ChangePercent *float64 `json:"change_percent,omitempty"`
	Volume        *int64   `json:"volume,omitempty"`
	MarketCap     *int64   `json:"market_cap,omitempty"`
	Currency      *string  `json:"currency,omitempty"`
	Timestamp     *int64   `json:"timestamp,omitempty"`
}

// QuotesRequest represents a request to get multiple quotes
type QuotesRequest struct {
	Symbols []string `json:"symbols" binding:"required,min=1"`
}

// QuotesResponse represents a batch quotes response
type QuotesResponse struct {
	Quotes        []Quote  `json:"quotes"`
	SuccessCount  int      `json:"success_count"`
	FailedSymbols []string `json:"failed_symbols"`
}

// HistoryDataPoint represents a single historical data point
type HistoryDataPoint struct {
	Date      string   `json:"date"`
	Timestamp *int64   `json:"timestamp,omitempty"` // Unix timestamp in milliseconds
	Open      *float64 `json:"open,omitempty"`
	High      *float64 `json:"high,omitempty"`
	Low       *float64 `json:"low,omitempty"`
	Close     *float64 `json:"close,omitempty"`
	Volume    *int64   `json:"volume,omitempty"`
}

// HistoryResponse represents historical price data
type HistoryResponse struct {
	Symbol     string             `json:"symbol"`
	Period     string             `json:"period"`
	Interval   string             `json:"interval"`
	Currency   *string            `json:"currency,omitempty"`
	DataPoints []HistoryDataPoint `json:"data_points"`
}

// InfoResponse represents basic stock/crypto information
type InfoResponse struct {
	Symbol      string  `json:"symbol"`
	Name        *string `json:"name,omitempty"`
	Sector      *string `json:"sector,omitempty"`
	Industry    *string `json:"industry,omitempty"`
	MarketCap   *int64  `json:"market_cap,omitempty"`
	Description *string `json:"description,omitempty"`
	Currency    *string `json:"currency,omitempty"`
	Website     *string `json:"website,omitempty"`
	Country     *string `json:"country,omitempty"`
}

// SearchResult represents a single search result
type SearchResult struct {
	Symbol    string  `json:"symbol"`
	Name      *string `json:"name,omitempty"`
	Exchange  *string `json:"exchange,omitempty"`
	AssetType *string `json:"asset_type,omitempty"`
}

// SearchResponse represents search results
type SearchResponse struct {
	Query   string         `json:"query"`
	Results []SearchResult `json:"results"`
	Count   int            `json:"count"`
}
