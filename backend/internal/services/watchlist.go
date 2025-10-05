package services

import (
	"errors"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"

	"gorm.io/gorm"
)

// WatchlistService provides watchlist management functionality
type WatchlistService struct {
	db            *gorm.DB
	marketService *MarketService
}

// NewWatchlistService creates a new watchlist service
func NewWatchlistService(marketService *MarketService) *WatchlistService {
	return &WatchlistService{
		db:            database.GetDB(),
		marketService: marketService,
	}
}

// Create adds a new watchlist item
func (s *WatchlistService) Create(watchlist *models.Watchlist) error {
	// Check if already exists for this user
	var existing models.Watchlist
	err := s.db.Where("user_id = ? AND symbol = ?", watchlist.UserID, watchlist.Symbol).First(&existing).Error
	if err == nil {
		return errors.New("symbol already in watchlist")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	return s.db.Create(watchlist).Error
}

// GetByUserID returns all watchlist items for a user
func (s *WatchlistService) GetByUserID(userID uint) ([]models.Watchlist, error) {
	var watchlist []models.Watchlist
	err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&watchlist).Error
	return watchlist, err
}

// GetByID returns a watchlist item by ID
func (s *WatchlistService) GetByID(id uint) (*models.Watchlist, error) {
	var watchlist models.Watchlist
	err := s.db.First(&watchlist, id).Error
	if err != nil {
		return nil, err
	}
	return &watchlist, nil
}

// Update updates a watchlist item
func (s *WatchlistService) Update(id uint, updates map[string]interface{}) error {
	return s.db.Model(&models.Watchlist{}).Where("id = ?", id).Updates(updates).Error
}

// Delete removes a watchlist item
func (s *WatchlistService) Delete(id uint) error {
	return s.db.Delete(&models.Watchlist{}, id).Error
}

// GetWatchlistWithQuotes returns watchlist items with real-time quotes
func (s *WatchlistService) GetWatchlistWithQuotes(userID uint) ([]map[string]interface{}, error) {
	// Get watchlist items
	watchlist, err := s.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	if len(watchlist) == 0 {
		return []map[string]interface{}{}, nil
	}

	// Extract symbols
	symbols := make([]string, len(watchlist))
	for i, item := range watchlist {
		symbols[i] = item.Symbol
	}

	// Get quotes for all symbols
	quotesResp, err := s.marketService.GetQuotes(symbols)
	if err != nil {
		// If market service fails, return watchlist without quotes
		result := make([]map[string]interface{}, len(watchlist))
		for i, item := range watchlist {
			result[i] = map[string]interface{}{
				"id":         item.ID,
				"symbol":     item.Symbol,
				"name":       item.Name,
				"asset_type": item.AssetType,
				"notes":      item.Notes,
				"created_at": item.CreatedAt,
				"updated_at": item.UpdatedAt,
			}
		}
		return result, nil
	}

	// Merge watchlist with quotes
	result := make([]map[string]interface{}, len(watchlist))
	for i, item := range watchlist {
		itemMap := map[string]interface{}{
			"id":         item.ID,
			"symbol":     item.Symbol,
			"name":       item.Name,
			"asset_type": item.AssetType,
			"notes":      item.Notes,
			"created_at": item.CreatedAt,
			"updated_at": item.UpdatedAt,
		}

		// Find matching quote
		for _, quote := range quotesResp.Quotes {
			if quote.Symbol == item.Symbol {
				itemMap["quote"] = quote
				break
			}
		}

		result[i] = itemMap
	}

	return result, nil
}
