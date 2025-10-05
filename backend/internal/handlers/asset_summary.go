package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

var globalAssetService *services.AssetService

// SetAssetService sets the global asset service instance
func SetAssetService(service *services.AssetService) {
	globalAssetService = service
}

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
	if globalAssetService == nil {
		logger.Error("AssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	summary, err := globalAssetService.CalculateAssetSummary()
	if err != nil {
		logger.Error("Failed to calculate asset summary", zap.Error(err))
		response.InternalError(c, "Failed to calculate asset summary")
		return
	}

	// Convert to response format
	responseSummary := AssetsSummary{
		TotalAssets: summary.TotalAssets,
		TotalDebt:   summary.TotalDebt,
		NetAssets:   summary.NetAssets,
		Categories:  summary.Categories,
	}

	response.Success(c, responseSummary)
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
	if globalAssetService == nil {
		logger.Error("AssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	period := c.DefaultQuery("period", "30d")

	historyRecords, err := globalAssetService.GetAssetHistory(period)
	if err != nil {
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

	response.Success(c, history)
}

type AssetStatisticsItem struct {
	Date        string  `json:"date"`
	TotalAssets float64 `json:"total_assets"`
	Profit      float64 `json:"profit"`
	ProfitRate  float64 `json:"profit_rate"`
	NetAssets   float64 `json:"net_assets"`
}

// GetAssetsStatistics gets asset statistics aggregated by dimension
// @Summary Get assets statistics
// @Description Get assets statistics aggregated by dimension (daily/weekly/monthly)
// @Tags assets
// @Produce json
// @Param dimension query string false "Aggregation dimension: daily, weekly, monthly" default(daily)
// @Param period query string false "Time period: 7d, 30d, 90d, 1y" default(30d)
// @Success 200 {object} response.Response{data=[]AssetStatisticsItem}
// @Router /api/assets/statistics [get]
func GetAssetsStatistics(c *gin.Context) {
	if globalAssetService == nil {
		logger.Error("AssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	dimension := c.DefaultQuery("dimension", "daily")
	period := c.DefaultQuery("period", "30d")

	statisticsData, err := globalAssetService.GetAssetStatistics(dimension, period)
	if err != nil {
		logger.Error("Failed to retrieve asset statistics", zap.Error(err))
		response.InternalError(c, "Failed to retrieve asset statistics")
		return
	}

	// Convert to response format
	var statistics []AssetStatisticsItem
	for _, item := range statisticsData {
		statistics = append(statistics, AssetStatisticsItem{
			Date:        item.Date,
			TotalAssets: item.TotalAssets,
			Profit:      item.Profit,
			ProfitRate:  item.ProfitRate,
			NetAssets:   item.NetAssets,
		})
	}

	response.Success(c, statistics)
}
