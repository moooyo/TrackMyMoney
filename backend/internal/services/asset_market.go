package services

import (
	"fmt"
	"strings"

	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
)

// AssetMarketService handles integration between assets and market data
type AssetMarketService struct {
	marketService *MarketService
}

// NewAssetMarketService creates a new asset market service
func NewAssetMarketService(marketService *MarketService) *AssetMarketService {
	return &AssetMarketService{
		marketService: marketService,
	}
}

// ValidateAndEnrichStockAsset validates symbol and enriches asset with market data
func (s *AssetMarketService) ValidateAndEnrichStockAsset(asset *models.StockAsset) error {
	if asset.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}

	// Get quote from market
	quote, err := s.marketService.GetQuote(asset.Symbol)
	if err != nil {
		logger.Warn(fmt.Sprintf("Failed to get quote for symbol %s: %v", asset.Symbol, err))
		return fmt.Errorf("invalid symbol or market data unavailable: %s", asset.Symbol)
	}

	// Enrich asset with market data
	if asset.CurrentPrice == 0 && quote.Price != nil {
		asset.CurrentPrice = *quote.Price
	}

	if asset.Name == "" && quote.Name != nil {
		asset.Name = *quote.Name
	}

	if asset.Currency == "" && quote.Currency != nil {
		asset.Currency = *quote.Currency
	}

	return nil
}

// ValidateAndEnrichCryptoAsset validates symbol and enriches asset with market data
func (s *AssetMarketService) ValidateAndEnrichCryptoAsset(asset *models.CryptoAsset) error {
	if asset.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}

	// Normalize crypto symbol to Yahoo Finance format (e.g., BTC -> BTC-USD)
	symbol := s.normalizeCryptoSymbol(asset.Symbol)

	// Get quote from market
	quote, err := s.marketService.GetQuote(symbol)
	if err != nil {
		logger.Warn(fmt.Sprintf("Failed to get quote for symbol %s: %v", symbol, err))
		return fmt.Errorf("invalid symbol or market data unavailable: %s", asset.Symbol)
	}

	// Enrich asset with market data
	if asset.CurrentPrice == 0 && quote.Price != nil {
		asset.CurrentPrice = *quote.Price
	}

	if asset.Name == "" && quote.Name != nil {
		asset.Name = *quote.Name
	}

	return nil
}

// UpdateStockAssetPrice updates a single stock asset price
func (s *AssetMarketService) UpdateStockAssetPrice(asset *models.StockAsset) error {
	quote, err := s.marketService.GetQuote(asset.Symbol)
	if err != nil {
		return fmt.Errorf("failed to get quote for %s: %w", asset.Symbol, err)
	}

	if quote.Price != nil {
		asset.CurrentPrice = *quote.Price
	} else {
		return fmt.Errorf("no price data available for %s", asset.Symbol)
	}

	return nil
}

// UpdateCryptoAssetPrice updates a single crypto asset price
func (s *AssetMarketService) UpdateCryptoAssetPrice(asset *models.CryptoAsset) error {
	symbol := s.normalizeCryptoSymbol(asset.Symbol)

	quote, err := s.marketService.GetQuote(symbol)
	if err != nil {
		return fmt.Errorf("failed to get quote for %s: %w", symbol, err)
	}

	if quote.Price != nil {
		asset.CurrentPrice = *quote.Price
	} else {
		return fmt.Errorf("no price data available for %s", symbol)
	}

	return nil
}

// UpdateStockAssetsPrices updates prices for multiple stock assets
func (s *AssetMarketService) UpdateStockAssetsPrices(assets []models.StockAsset) (int, []string, error) {
	if len(assets) == 0 {
		return 0, nil, nil
	}

	// Collect symbols
	symbols := make([]string, len(assets))
	for i, asset := range assets {
		symbols[i] = asset.Symbol
	}

	// Get quotes in batch
	quotesResp, err := s.marketService.GetQuotes(symbols)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get batch quotes: %w", err)
	}

	// Create a map for quick lookup
	quoteMap := make(map[string]*models.Quote)
	for i := range quotesResp.Quotes {
		quote := &quotesResp.Quotes[i]
		quoteMap[quote.Symbol] = quote
	}

	// Update assets
	updated := 0
	var failed []string

	for i := range assets {
		asset := &assets[i]
		quote, found := quoteMap[asset.Symbol]

		if found && quote.Price != nil {
			asset.CurrentPrice = *quote.Price
			updated++
		} else {
			failed = append(failed, asset.Symbol)
		}
	}

	return updated, failed, nil
}

// UpdateCryptoAssetsPrices updates prices for multiple crypto assets
func (s *AssetMarketService) UpdateCryptoAssetsPrices(assets []models.CryptoAsset) (int, []string, error) {
	if len(assets) == 0 {
		return 0, nil, nil
	}

	// Collect and normalize symbols
	symbols := make([]string, len(assets))
	symbolMap := make(map[string]string) // normalized -> original

	for i, asset := range assets {
		normalized := s.normalizeCryptoSymbol(asset.Symbol)
		symbols[i] = normalized
		symbolMap[normalized] = asset.Symbol
	}

	// Get quotes in batch
	quotesResp, err := s.marketService.GetQuotes(symbols)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get batch quotes: %w", err)
	}

	// Create a map for quick lookup
	quoteMap := make(map[string]*models.Quote)
	for i := range quotesResp.Quotes {
		quote := &quotesResp.Quotes[i]
		// Map back to original symbol
		if original, found := symbolMap[quote.Symbol]; found {
			quoteMap[original] = quote
		}
	}

	// Update assets
	updated := 0
	var failed []string

	for i := range assets {
		asset := &assets[i]
		normalized := s.normalizeCryptoSymbol(asset.Symbol)
		quote, found := quoteMap[asset.Symbol]

		if !found {
			// Try normalized symbol
			quote, found = quoteMap[normalized]
		}

		if found && quote.Price != nil {
			asset.CurrentPrice = *quote.Price
			updated++
		} else {
			failed = append(failed, asset.Symbol)
		}
	}

	return updated, failed, nil
}

// normalizeCryptoSymbol converts crypto symbol to Yahoo Finance format
// Examples: BTC -> BTC-USD, ETH -> ETH-USD
func (s *AssetMarketService) normalizeCryptoSymbol(symbol string) string {
	symbol = strings.ToUpper(strings.TrimSpace(symbol))

	// If already in correct format (e.g., BTC-USD), return as-is
	if strings.Contains(symbol, "-") {
		return symbol
	}

	// Common crypto symbols - add -USD suffix
	return symbol + "-USD"
}
