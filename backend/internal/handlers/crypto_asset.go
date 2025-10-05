package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// RefreshPricesResponse represents the response for price refresh operations
type RefreshPricesResponse struct {
	Message string   `json:"message"`
	Updated int      `json:"updated"`
	Failed  []string `json:"failed"`
}

// CreateCryptoAssetRequest represents the request body for creating a crypto asset
type CreateCryptoAssetRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	Symbol        string  `json:"symbol" binding:"required"` // e.g., BTC, ETH
	Quantity      float64 `json:"quantity" binding:"required"`
	PurchasePrice float64 `json:"purchase_price" binding:"required"`
	CurrentPrice  float64 `json:"current_price"`
}

// UpdateCryptoAssetRequest represents the request body for updating a crypto asset
type UpdateCryptoAssetRequest struct {
	Name          *string  `json:"name"`
	Description   *string  `json:"description"`
	Symbol        *string  `json:"symbol"`
	Quantity      *float64 `json:"quantity"`
	PurchasePrice *float64 `json:"purchase_price"`
	CurrentPrice  *float64 `json:"current_price"`
}

// CreateCryptoAsset creates a new crypto asset
// @Summary Create crypto asset
// @Description Create a new cryptocurrency asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateCryptoAssetRequest true "Crypto asset info"
// @Success 200 {object} response.Response{data=models.CryptoAsset}
// @Router /api/assets/crypto [post]
func CreateCryptoAsset(c *gin.Context) {
	var req CreateCryptoAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	asset := models.CryptoAsset{
		Name:          req.Name,
		Description:   req.Description,
		Symbol:        req.Symbol,
		Quantity:      req.Quantity,
		PurchasePrice: req.PurchasePrice,
		CurrentPrice:  req.CurrentPrice,
	}

	// Validate symbol and enrich with market data
	if assetMarketService != nil {
		if err := assetMarketService.ValidateAndEnrichCryptoAsset(&asset); err != nil {
			logger.Warn("Failed to validate/enrich crypto asset", zap.Error(err))
			// Don't fail the request, just log the warning
		}
	}

	db := database.GetDB()
	if err := db.Create(&asset).Error; err != nil {
		logger.Error("Failed to create crypto asset", zap.Error(err))
		response.InternalError(c, "Failed to create crypto asset")
		return
	}

	logger.Info("Crypto asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// GetCryptoAssets retrieves all crypto assets
// @Summary List crypto assets
// @Description Get all cryptocurrency assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=[]models.CryptoAsset}
// @Router /api/assets/crypto [get]
func GetCryptoAssets(c *gin.Context) {
	var assets []models.CryptoAsset
	db := database.GetDB()

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve crypto assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve crypto assets")
		return
	}

	response.Success(c, assets)
}

// GetCryptoAsset retrieves a single crypto asset by ID
// @Summary Get crypto asset
// @Description Get a cryptocurrency asset by ID
// @Tags assets
// @Produce json
// @Param id path int true "Crypto Asset ID"
// @Success 200 {object} response.Response{data=models.CryptoAsset}
// @Router /api/assets/crypto/{id} [get]
func GetCryptoAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var asset models.CryptoAsset
	db := database.GetDB()

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Crypto asset not found", zap.Error(err))
		response.NotFound(c, "Crypto asset not found")
		return
	}

	response.Success(c, asset)
}

// UpdateCryptoAsset updates an existing crypto asset
// @Summary Update crypto asset
// @Description Update a cryptocurrency asset
// @Tags assets
// @Accept json
// @Produce json
// @Param id path int true "Crypto Asset ID"
// @Param asset body UpdateCryptoAssetRequest true "Crypto asset info"
// @Success 200 {object} response.Response{data=models.CryptoAsset}
// @Router /api/assets/crypto/{id} [put]
func UpdateCryptoAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var req UpdateCryptoAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var asset models.CryptoAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Crypto asset not found", zap.Error(err))
		response.NotFound(c, "Crypto asset not found")
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

	// If symbol changed, revalidate and update market data
	if symbolChanged && assetMarketService != nil {
		if err := assetMarketService.ValidateAndEnrichCryptoAsset(&asset); err != nil {
			logger.Warn("Failed to validate/enrich updated crypto asset", zap.Error(err))
		}
	}

	if err := db.Save(&asset).Error; err != nil {
		logger.Error("Failed to update crypto asset", zap.Error(err))
		response.InternalError(c, "Failed to update crypto asset")
		return
	}

	logger.Info("Crypto asset updated", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// DeleteCryptoAsset deletes a crypto asset
// @Summary Delete crypto asset
// @Description Delete a cryptocurrency asset
// @Tags assets
// @Param id path int true "Crypto Asset ID"
// @Success 200 {object} response.Response
// @Router /api/assets/crypto/{id} [delete]
func DeleteCryptoAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	db := database.GetDB()
	var asset models.CryptoAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Crypto asset not found", zap.Error(err))
		response.NotFound(c, "Crypto asset not found")
		return
	}

	if err := db.Delete(&asset).Error; err != nil {
		logger.Error("Failed to delete crypto asset", zap.Error(err))
		response.InternalError(c, "Failed to delete crypto asset")
		return
	}

	logger.Info("Crypto asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Crypto asset deleted successfully"})
}

// RefreshCryptoAssetsPrices refreshes prices for all crypto assets
// @Summary Refresh crypto prices
// @Description Refresh current prices for all cryptocurrency assets from market data
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=RefreshPricesResponse}
// @Router /api/assets/crypto/refresh-prices [post]
func RefreshCryptoAssetsPrices(c *gin.Context) {
	if assetMarketService == nil {
		response.InternalError(c, "Market service not available")
		return
	}

	db := database.GetDB()
	var assets []models.CryptoAsset

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve crypto assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve crypto assets")
		return
	}

	if len(assets) == 0 {
		response.Success(c, RefreshPricesResponse{
			Message: "No crypto assets to refresh",
			Updated: 0,
			Failed:  []string{},
		})
		return
	}

	// Update prices
	updated, failed, err := assetMarketService.UpdateCryptoAssetsPrices(assets)
	if err != nil {
		logger.Error("Failed to refresh crypto prices", zap.Error(err))
		response.InternalError(c, "Failed to refresh crypto prices")
		return
	}

	// Save updated assets to database
	for i := range assets {
		if err := db.Save(&assets[i]).Error; err != nil {
			logger.Error("Failed to save updated crypto asset", zap.Uint("id", assets[i].ID), zap.Error(err))
		}
	}

	logger.Info("Crypto prices refreshed", zap.Int("updated", updated), zap.Int("failed", len(failed)))
	response.Success(c, RefreshPricesResponse{
		Message: "Crypto prices refreshed successfully",
		Updated: updated,
		Failed:  failed,
	})
}
