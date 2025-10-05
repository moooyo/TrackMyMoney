package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

type AssetsSummary struct {
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetAssets   float64            `json:"net_assets"`
	Categories  map[string]float64 `json:"categories"`
}

type AssetHistory struct {
	Date        string             `json:"date"`
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetAssets   float64            `json:"net_assets"`
	Categories  map[string]float64 `json:"categories,omitempty"`
}

// GetAssetsSummary gets current assets summary including total assets, debt, and net assets
// @Summary Get assets summary
// @Description Get current assets summary including total assets, debt, and net assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=AssetsSummary}
// @Router /api/assets/summary [get]
func GetAssetsSummary(c *gin.Context) {
	db := database.GetDB()

	var totalAssets float64
	var totalDebt float64
	categories := make(map[string]float64)

	// Sum cash assets
	var cashAssets []models.CashAsset
	if err := db.Find(&cashAssets).Error; err != nil {
		logger.Error("Failed to retrieve cash assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve cash assets")
		return
	}
	for _, asset := range cashAssets {
		totalAssets += asset.Amount
		categories["cash"] += asset.Amount
	}

	// Sum interest-bearing assets
	var interestBearingAssets []models.InterestBearingAsset
	if err := db.Find(&interestBearingAssets).Error; err != nil {
		logger.Error("Failed to retrieve interest-bearing assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve interest-bearing assets")
		return
	}
	for _, asset := range interestBearingAssets {
		totalAssets += asset.Amount
		categories["interest_bearing"] += asset.Amount
	}

	// Sum stock assets
	var stockAssets []models.StockAsset
	if err := db.Find(&stockAssets).Error; err != nil {
		logger.Error("Failed to retrieve stock assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve stock assets")
		return
	}
	for _, asset := range stockAssets {
		value := asset.Quantity * asset.CurrentPrice
		if asset.CurrentPrice == 0 {
			value = asset.Quantity * asset.PurchasePrice
		}
		totalAssets += value
		categories["stock"] += value
	}

	// Sum crypto assets
	var cryptoAssets []models.CryptoAsset
	if err := db.Find(&cryptoAssets).Error; err != nil {
		logger.Error("Failed to retrieve crypto assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve crypto assets")
		return
	}
	for _, asset := range cryptoAssets {
		value := asset.Quantity * asset.CurrentPrice
		if asset.CurrentPrice == 0 {
			value = asset.Quantity * asset.PurchasePrice
		}
		totalAssets += value
		categories["crypto"] += value
	}

	// Sum debt assets
	var debtAssets []models.DebtAsset
	if err := db.Find(&debtAssets).Error; err != nil {
		logger.Error("Failed to retrieve debt assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve debt assets")
		return
	}
	for _, asset := range debtAssets {
		totalDebt += asset.Amount
		categories["debt"] += asset.Amount
	}

	netAssets := totalAssets - totalDebt

	summary := AssetsSummary{
		TotalAssets: totalAssets,
		TotalDebt:   totalDebt,
		NetAssets:   netAssets,
		Categories:  categories,
	}

	response.Success(c, summary)
}

// GetAssetsHistory gets historical assets data
// @Summary Get assets history
// @Description Get historical assets data
// @Tags assets
// @Produce json
// @Param period query string false "Time period: 7d, 30d, 90d, 1y" default(30d)
// @Success 200 {object} response.Response{data=[]AssetHistory}
// @Router /api/assets/history [get]
func GetAssetsHistory(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")

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
	db := database.GetDB()

	if err := db.Where("date >= ?", startDate).Order("date ASC").Find(&historyRecords).Error; err != nil {
		logger.Error("Failed to retrieve asset history", zap.Error(err))
		response.InternalError(c, "Failed to retrieve asset history")
		return
	}

	// Convert to response format
	var history []AssetHistory
	for _, record := range historyRecords {
		history = append(history, AssetHistory{
			Date:        record.Date.Format("2006-01-02"),
			TotalAssets: record.TotalAssets,
			TotalDebt:   record.TotalDebt,
			NetAssets:   record.NetAssets,
		})
	}

	// If no history, generate current snapshot from all asset types
	if len(history) == 0 {
		var totalAssets, totalDebt float64

		// Cash assets
		var cashAssets []models.CashAsset
		if err := db.Find(&cashAssets).Error; err == nil {
			for _, asset := range cashAssets {
				totalAssets += asset.Amount
			}
		}

		// Interest-bearing assets
		var interestBearingAssets []models.InterestBearingAsset
		if err := db.Find(&interestBearingAssets).Error; err == nil {
			for _, asset := range interestBearingAssets {
				totalAssets += asset.Amount
			}
		}

		// Stock assets
		var stockAssets []models.StockAsset
		if err := db.Find(&stockAssets).Error; err == nil {
			for _, asset := range stockAssets {
				value := asset.Quantity * asset.CurrentPrice
				if asset.CurrentPrice == 0 {
					value = asset.Quantity * asset.PurchasePrice
				}
				totalAssets += value
			}
		}

		// Crypto assets
		var cryptoAssets []models.CryptoAsset
		if err := db.Find(&cryptoAssets).Error; err == nil {
			for _, asset := range cryptoAssets {
				value := asset.Quantity * asset.CurrentPrice
				if asset.CurrentPrice == 0 {
					value = asset.Quantity * asset.PurchasePrice
				}
				totalAssets += value
			}
		}

		// Debt assets
		var debtAssets []models.DebtAsset
		if err := db.Find(&debtAssets).Error; err == nil {
			for _, asset := range debtAssets {
				totalDebt += asset.Amount
			}
		}

		history = append(history, AssetHistory{
			Date:        now.Format("2006-01-02"),
			TotalAssets: totalAssets,
			TotalDebt:   totalDebt,
			NetAssets:   totalAssets - totalDebt,
		})
	}

	response.Success(c, history)
}
