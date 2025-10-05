package services

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
	"trackmymoney/internal/models"
)

// AssetService handles asset-related business logic
type AssetService struct {
	db *gorm.DB
}

// NewAssetService creates a new asset service
func NewAssetService(db *gorm.DB) *AssetService {
	return &AssetService{
		db: db,
	}
}

// AssetSummary represents the summary of all assets
type AssetSummary struct {
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetAssets   float64            `json:"net_assets"`
	Categories  map[string]float64 `json:"categories"`
}

// CalculateAssetSummary calculates the total value of all assets
// This method consolidates the duplicate logic found in:
// - handlers.GetAssetsSummary
// - handlers.GetAssetsHistory
// - jobs.calculateAssetSummary
func (s *AssetService) CalculateAssetSummary() (*AssetSummary, error) {
	summary := &AssetSummary{
		Categories: make(map[string]float64),
	}

	// Cash assets
	var cashTotal float64
	if err := s.db.Model(&models.CashAsset{}).Select("COALESCE(SUM(amount), 0)").Scan(&cashTotal).Error; err != nil {
		return nil, fmt.Errorf("failed to sum cash assets: %w", err)
	}
	summary.TotalAssets += cashTotal
	summary.Categories["cash"] = cashTotal

	// Interest-bearing assets
	var interestBearingTotal float64
	if err := s.db.Model(&models.InterestBearingAsset{}).Select("COALESCE(SUM(amount), 0)").Scan(&interestBearingTotal).Error; err != nil {
		return nil, fmt.Errorf("failed to sum interest-bearing assets: %w", err)
	}
	summary.TotalAssets += interestBearingTotal
	summary.Categories["interest_bearing"] = interestBearingTotal

	// Stock assets (quantity * current_price, fallback to purchase_price if current_price is 0)
	var stockAssets []models.StockAsset
	if err := s.db.Find(&stockAssets).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve stock assets: %w", err)
	}
	var stockTotal float64
	for _, asset := range stockAssets {
		price := asset.CurrentPrice
		if price == 0 {
			price = asset.PurchasePrice
		}
		value := asset.Quantity * price
		stockTotal += value
	}
	summary.TotalAssets += stockTotal
	summary.Categories["stock"] = stockTotal

	// Crypto assets (quantity * current_price, fallback to purchase_price if current_price is 0)
	var cryptoAssets []models.CryptoAsset
	if err := s.db.Find(&cryptoAssets).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve crypto assets: %w", err)
	}
	var cryptoTotal float64
	for _, asset := range cryptoAssets {
		price := asset.CurrentPrice
		if price == 0 {
			price = asset.PurchasePrice
		}
		value := asset.Quantity * price
		cryptoTotal += value
	}
	summary.TotalAssets += cryptoTotal
	summary.Categories["crypto"] = cryptoTotal

	// Debt assets
	var debtTotal float64
	if err := s.db.Model(&models.DebtAsset{}).Select("COALESCE(SUM(amount), 0)").Scan(&debtTotal).Error; err != nil {
		return nil, fmt.Errorf("failed to sum debt assets: %w", err)
	}
	summary.TotalDebt = debtTotal
	summary.Categories["debt"] = debtTotal

	summary.NetAssets = summary.TotalAssets - summary.TotalDebt

	return summary, nil
}

// SaveAssetHistory saves the asset summary to history
func (s *AssetService) SaveAssetHistory(summary *AssetSummary) error {
	today := time.Now().Truncate(24 * time.Hour)

	// Serialize category breakdown
	categoryJSON, err := json.Marshal(summary.Categories)
	if err != nil {
		return fmt.Errorf("failed to marshal category breakdown: %w", err)
	}

	// Check if history for today already exists
	var existing models.AssetHistory
	err = s.db.Where("date = ?", today).First(&existing).Error
	if err == nil {
		// Update existing record
		existing.TotalAssets = summary.TotalAssets
		existing.TotalDebt = summary.TotalDebt
		existing.NetAssets = summary.NetAssets
		existing.CategoryBreakdown = string(categoryJSON)
		return s.db.Save(&existing).Error
	}

	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to check existing history: %w", err)
	}

	// Create new record
	history := models.AssetHistory{
		Date:              today,
		TotalAssets:       summary.TotalAssets,
		TotalDebt:         summary.TotalDebt,
		NetAssets:         summary.NetAssets,
		CategoryBreakdown: string(categoryJSON),
	}

	return s.db.Create(&history).Error
}

// GetAssetHistory retrieves historical asset data for a given period
func (s *AssetService) GetAssetHistory(period string) ([]models.AssetHistory, error) {
	var startDate time.Time
	now := time.Now()

	switch period {
	case "7d":
		startDate = now.AddDate(0, 0, -7)
	case "30d":
		startDate = now.AddDate(0, 0, -30)
	case "90d":
		startDate = now.AddDate(0, 0, -90)
	case "1y":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, 0, -30)
	}

	var historyRecords []models.AssetHistory
	err := s.db.Where("date >= ?", startDate).Order("date ASC").Find(&historyRecords).Error
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve asset history: %w", err)
	}

	// If no history found, create a snapshot of current state
	if len(historyRecords) == 0 {
		summary, err := s.CalculateAssetSummary()
		if err != nil {
			return nil, fmt.Errorf("failed to calculate current asset summary: %w", err)
		}

		categoryJSON, _ := json.Marshal(summary.Categories)
		currentSnapshot := models.AssetHistory{
			Date:              now.Truncate(24 * time.Hour),
			TotalAssets:       summary.TotalAssets,
			TotalDebt:         summary.TotalDebt,
			NetAssets:         summary.NetAssets,
			CategoryBreakdown: string(categoryJSON),
		}

		historyRecords = append(historyRecords, currentSnapshot)
	}

	return historyRecords, nil
}
