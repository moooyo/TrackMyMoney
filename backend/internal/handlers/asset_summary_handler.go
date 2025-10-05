package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// AssetSummaryHandler handles asset summary requests
type AssetSummaryHandler struct {
	assetService *services.AssetService
}

// NewAssetSummaryHandler creates a new asset summary handler
func NewAssetSummaryHandler(assetService *services.AssetService) *AssetSummaryHandler {
	return &AssetSummaryHandler{
		assetService: assetService,
	}
}

type AssetsSummaryResponse struct {
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetAssets   float64            `json:"net_assets"`
	Categories  map[string]float64 `json:"categories"`
}

type AssetHistoryResponse struct {
	Date        string             `json:"date"`
	TotalAssets float64            `json:"total_assets"`
	TotalDebt   float64            `json:"total_debt"`
	NetAssets   float64            `json:"net_assets"`
	Categories  map[string]float64 `json:"categories,omitempty"`
}

// GetSummary gets current assets summary including total assets, debt, and net assets
// @Summary Get assets summary
// @Description Get current assets summary including total assets, debt, and net assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=AssetsSummaryResponse}
// @Router /api/assets/summary [get]
func (h *AssetSummaryHandler) GetSummary(c *gin.Context) {
	summary, err := h.assetService.CalculateAssetSummary()
	if err != nil {
		logger.Error("Failed to calculate asset summary", zap.Error(err))
		response.InternalError(c, "Failed to calculate asset summary")
		return
	}

	// Convert to response format
	responseSummary := AssetsSummaryResponse{
		TotalAssets: summary.TotalAssets,
		TotalDebt:   summary.TotalDebt,
		NetAssets:   summary.NetAssets,
		Categories:  summary.Categories,
	}

	response.Success(c, responseSummary)
}

// GetHistory gets historical assets data
// @Summary Get assets history
// @Description Get historical assets data
// @Tags assets
// @Produce json
// @Param period query string false "Time period: 7d, 30d, 90d, 1y" default(30d)
// @Success 200 {object} response.Response{data=[]AssetHistoryResponse}
// @Router /api/assets/history [get]
func (h *AssetSummaryHandler) GetHistory(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")

	historyRecords, err := h.assetService.GetAssetHistory(period)
	if err != nil {
		logger.Error("Failed to retrieve asset history", zap.Error(err))
		response.InternalError(c, "Failed to retrieve asset history")
		return
	}

	// Convert to response format
	var history []AssetHistoryResponse
	for _, record := range historyRecords {
		history = append(history, AssetHistoryResponse{
			Date:        record.Date.Format("2006-01-02"),
			TotalAssets: record.TotalAssets,
			TotalDebt:   record.TotalDebt,
			NetAssets:   record.NetAssets,
		})
	}

	response.Success(c, history)
}
