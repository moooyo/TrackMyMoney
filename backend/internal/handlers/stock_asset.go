package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

var assetMarketService *services.AssetMarketService

// SetAssetMarketService sets the asset market service instance
func SetAssetMarketService(service *services.AssetMarketService) {
	assetMarketService = service
}

// RefreshPricesResponse represents the response for price refresh operations
type RefreshPricesResponse struct {
	Message string   `json:"message"`
	Updated int      `json:"updated"`
	Failed  []string `json:"failed"`
}

// CreateStockAssetRequest represents the request body for creating a stock asset
type CreateStockAssetRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	BrokerAccount string  `json:"broker_account" binding:"required"`
	Symbol        string  `json:"symbol" binding:"required"`
	Quantity      float64 `json:"quantity" binding:"required"`
	PurchasePrice float64 `json:"purchase_price" binding:"required"`
	CurrentPrice  float64 `json:"current_price"`
	Currency      string  `json:"currency"`
}

// UpdateStockAssetRequest represents the request body for updating a stock asset
type UpdateStockAssetRequest struct {
	Name          *string  `json:"name"`
	Description   *string  `json:"description"`
	BrokerAccount *string  `json:"broker_account"`
	Symbol        *string  `json:"symbol"`
	Quantity      *float64 `json:"quantity"`
	PurchasePrice *float64 `json:"purchase_price"`
	CurrentPrice  *float64 `json:"current_price"`
	Currency      *string  `json:"currency"`
}

// CreateStockAsset creates a new stock asset
// @Summary Create stock asset
// @Description Create a new stock/ETF asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateStockAssetRequest true "Stock asset info"
// @Success 200 {object} response.Response{data=models.StockAsset}
// @Router /api/assets/stock [post]
func CreateStockAsset(c *gin.Context) {
	var req CreateStockAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	asset := models.StockAsset{
		Name:          req.Name,
		Description:   req.Description,
		BrokerAccount: req.BrokerAccount,
		Symbol:        req.Symbol,
		Quantity:      req.Quantity,
		PurchasePrice: req.PurchasePrice,
		CurrentPrice:  req.CurrentPrice,
		Currency:      req.Currency,
	}

	if asset.Currency == "" {
		asset.Currency = "CNY"
	}

	// Validate symbol and enrich with market data
	if assetMarketService != nil {
		if err := assetMarketService.ValidateAndEnrichStockAsset(&asset); err != nil {
			logger.Warn("Failed to validate/enrich stock asset", zap.Error(err))
			// Don't fail the request, just log the warning
			// User can still create the asset manually
		}
	}

	db := database.GetDB()
	if err := db.Create(&asset).Error; err != nil {
		logger.Error("Failed to create stock asset", zap.Error(err))
		response.InternalError(c, "Failed to create stock asset")
		return
	}

	logger.Info("Stock asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// GetStockAssets retrieves all stock assets
// @Summary List stock assets
// @Description Get all stock/ETF assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=[]models.StockAsset}
// @Router /api/assets/stock [get]
func GetStockAssets(c *gin.Context) {
	var assets []models.StockAsset
	db := database.GetDB()

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve stock assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve stock assets")
		return
	}

	response.Success(c, assets)
}

// GetStockAsset retrieves a single stock asset by ID
// @Summary Get stock asset
// @Description Get a stock/ETF asset by ID
// @Tags assets
// @Produce json
// @Param id path int true "Stock Asset ID"
// @Success 200 {object} response.Response{data=models.StockAsset}
// @Router /api/assets/stock/{id} [get]
func GetStockAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var asset models.StockAsset
	db := database.GetDB()

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Stock asset not found", zap.Error(err))
		response.NotFound(c, "Stock asset not found")
		return
	}

	response.Success(c, asset)
}

// UpdateStockAsset updates an existing stock asset
// @Summary Update stock asset
// @Description Update a stock/ETF asset
// @Tags assets
// @Accept json
// @Produce json
// @Param id path int true "Stock Asset ID"
// @Param asset body UpdateStockAssetRequest true "Stock asset info"
// @Success 200 {object} response.Response{data=models.StockAsset}
// @Router /api/assets/stock/{id} [put]
func UpdateStockAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var req UpdateStockAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var asset models.StockAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Stock asset not found", zap.Error(err))
		response.NotFound(c, "Stock asset not found")
		return
	}

	// Track if symbol changed
	symbolChanged := false

	// Update fields if provided
	if req.Name != nil {
		asset.Name = *req.Name
	}
	if req.Description != nil {
		asset.Description = *req.Description
	}
	if req.BrokerAccount != nil {
		asset.BrokerAccount = *req.BrokerAccount
	}
	if req.Symbol != nil {
		if *req.Symbol != asset.Symbol {
			symbolChanged = true
		}
		asset.Symbol = *req.Symbol
	}
	if req.Quantity != nil {
		asset.Quantity = *req.Quantity
	}
	if req.PurchasePrice != nil {
		asset.PurchasePrice = *req.PurchasePrice
	}
	if req.CurrentPrice != nil {
		asset.CurrentPrice = *req.CurrentPrice
	}
	if req.Currency != nil {
		asset.Currency = *req.Currency
	}

	// If symbol changed, revalidate and update market data
	if symbolChanged && assetMarketService != nil {
		if err := assetMarketService.ValidateAndEnrichStockAsset(&asset); err != nil {
			logger.Warn("Failed to validate/enrich updated stock asset", zap.Error(err))
		}
	}

	if err := db.Save(&asset).Error; err != nil {
		logger.Error("Failed to update stock asset", zap.Error(err))
		response.InternalError(c, "Failed to update stock asset")
		return
	}

	logger.Info("Stock asset updated", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// DeleteStockAsset deletes a stock asset
// @Summary Delete stock asset
// @Description Delete a stock/ETF asset
// @Tags assets
// @Param id path int true "Stock Asset ID"
// @Success 200 {object} response.Response
// @Router /api/assets/stock/{id} [delete]
func DeleteStockAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	db := database.GetDB()
	var asset models.StockAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Stock asset not found", zap.Error(err))
		response.NotFound(c, "Stock asset not found")
		return
	}

	if err := db.Delete(&asset).Error; err != nil {
		logger.Error("Failed to delete stock asset", zap.Error(err))
		response.InternalError(c, "Failed to delete stock asset")
		return
	}

	logger.Info("Stock asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Stock asset deleted successfully"})
}

// RefreshStockAssetsPrices refreshes prices for all stock assets
// @Summary Refresh stock prices
// @Description Refresh current prices for all stock assets from market data
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=RefreshPricesResponse}
// @Router /api/assets/stock/refresh-prices [post]
func RefreshStockAssetsPrices(c *gin.Context) {
	if assetMarketService == nil {
		response.InternalError(c, "Market service not available")
		return
	}

	db := database.GetDB()
	var assets []models.StockAsset

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve stock assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve stock assets")
		return
	}

	if len(assets) == 0 {
		response.Success(c, RefreshPricesResponse{
			Message: "No stock assets to refresh",
			Updated: 0,
			Failed:  []string{},
		})
		return
	}

	// Update prices
	updated, failed, err := assetMarketService.UpdateStockAssetsPrices(assets)
	if err != nil {
		logger.Error("Failed to refresh stock prices", zap.Error(err))
		response.InternalError(c, "Failed to refresh stock prices")
		return
	}

	// Save updated assets to database
	for i := range assets {
		if err := db.Save(&assets[i]).Error; err != nil {
			logger.Error("Failed to save updated stock asset", zap.Uint("id", assets[i].ID), zap.Error(err))
		}
	}

	logger.Info("Stock prices refreshed", zap.Int("updated", updated), zap.Int("failed", len(failed)))
	response.Success(c, RefreshPricesResponse{
		Message: "Stock prices refreshed successfully",
		Updated: updated,
		Failed:  failed,
	})
}
