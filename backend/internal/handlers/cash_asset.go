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

// CreateCashAssetRequest represents the request body for creating a cash asset
type CreateCashAssetRequest struct {
	Name        string  `json:"name" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
}

// UpdateCashAssetRequest represents the request body for updating a cash asset
type UpdateCashAssetRequest struct {
	Name        *string  `json:"name"`
	Amount      *float64 `json:"amount"`
	Currency    *string  `json:"currency"`
	Description *string  `json:"description"`
}

// CreateCashAsset creates a new cash asset
// @Summary Create cash asset
// @Description Create a new cash asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateCashAssetRequest true "Cash asset info"
// @Success 200 {object} response.Response{data=models.CashAsset}
// @Router /api/assets/cash [post]
func CreateCashAsset(c *gin.Context) {
	var req CreateCashAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	asset := models.CashAsset{
		Name:        req.Name,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Description: req.Description,
	}

	if asset.Currency == "" {
		asset.Currency = "CNY"
	}

	db := database.GetDB()
	if err := db.Create(&asset).Error; err != nil {
		logger.Error("Failed to create cash asset", zap.Error(err))
		response.InternalError(c, "Failed to create cash asset")
		return
	}

	logger.Info("Cash asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// GetCashAssets retrieves all cash assets
// @Summary List cash assets
// @Description Get all cash assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=[]models.CashAsset}
// @Router /api/assets/cash [get]
func GetCashAssets(c *gin.Context) {
	var assets []models.CashAsset
	db := database.GetDB()

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve cash assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve cash assets")
		return
	}

	response.Success(c, assets)
}

// GetCashAsset retrieves a single cash asset by ID
// @Summary Get cash asset
// @Description Get a cash asset by ID
// @Tags assets
// @Produce json
// @Param id path int true "Cash Asset ID"
// @Success 200 {object} response.Response{data=models.CashAsset}
// @Router /api/assets/cash/{id} [get]
func GetCashAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var asset models.CashAsset
	db := database.GetDB()

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Cash asset not found", zap.Error(err))
		response.NotFound(c, "Cash asset not found")
		return
	}

	response.Success(c, asset)
}

// UpdateCashAsset updates an existing cash asset
// @Summary Update cash asset
// @Description Update a cash asset
// @Tags assets
// @Accept json
// @Produce json
// @Param id path int true "Cash Asset ID"
// @Param asset body UpdateCashAssetRequest true "Cash asset info"
// @Success 200 {object} response.Response{data=models.CashAsset}
// @Router /api/assets/cash/{id} [put]
func UpdateCashAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var req UpdateCashAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var asset models.CashAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Cash asset not found", zap.Error(err))
		response.NotFound(c, "Cash asset not found")
		return
	}

	// Update fields if provided
	if req.Name != nil {
		asset.Name = *req.Name
	}
	if req.Amount != nil {
		asset.Amount = *req.Amount
	}
	if req.Currency != nil {
		asset.Currency = *req.Currency
	}
	if req.Description != nil {
		asset.Description = *req.Description
	}

	if err := db.Save(&asset).Error; err != nil {
		logger.Error("Failed to update cash asset", zap.Error(err))
		response.InternalError(c, "Failed to update cash asset")
		return
	}

	logger.Info("Cash asset updated", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// DeleteCashAsset deletes a cash asset
// @Summary Delete cash asset
// @Description Delete a cash asset
// @Tags assets
// @Param id path int true "Cash Asset ID"
// @Success 200 {object} response.Response
// @Router /api/assets/cash/{id} [delete]
func DeleteCashAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	db := database.GetDB()
	var asset models.CashAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Cash asset not found", zap.Error(err))
		response.NotFound(c, "Cash asset not found")
		return
	}

	if err := db.Delete(&asset).Error; err != nil {
		logger.Error("Failed to delete cash asset", zap.Error(err))
		response.InternalError(c, "Failed to delete cash asset")
		return
	}

	logger.Info("Cash asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Cash asset deleted successfully"})
}
