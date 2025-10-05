package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// CreateDebtAssetRequest represents the request body for creating a debt asset
type CreateDebtAssetRequest struct {
	Name         string     `json:"name" binding:"required"`
	Amount       float64    `json:"amount" binding:"required"` // Negative value for liabilities
	Currency     string     `json:"currency"`
	Description  string     `json:"description"`
	Creditor     string     `json:"creditor" binding:"required"`
	InterestRate *float64   `json:"interest_rate,omitempty"`
	DueDate      *time.Time `json:"due_date,omitempty"`
}

// UpdateDebtAssetRequest represents the request body for updating a debt asset
type UpdateDebtAssetRequest struct {
	Name         *string    `json:"name"`
	Amount       *float64   `json:"amount"`
	Currency     *string    `json:"currency"`
	Description  *string    `json:"description"`
	Creditor     *string    `json:"creditor"`
	InterestRate *float64   `json:"interest_rate,omitempty"`
	DueDate      *time.Time `json:"due_date,omitempty"`
}

// CreateDebtAsset creates a new debt asset
// @Summary Create debt asset
// @Description Create a new debt/liability asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateDebtAssetRequest true "Debt asset info"
// @Success 200 {object} response.Response{data=models.DebtAsset}
// @Router /api/assets/debt [post]
func CreateDebtAsset(c *gin.Context) {
	var req CreateDebtAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	asset := models.DebtAsset{
		Name:         req.Name,
		Amount:       req.Amount,
		Currency:     req.Currency,
		Description:  req.Description,
		Creditor:     req.Creditor,
		InterestRate: req.InterestRate,
		DueDate:      req.DueDate,
	}

	if asset.Currency == "" {
		asset.Currency = "CNY"
	}

	db := database.GetDB()
	if err := db.Create(&asset).Error; err != nil {
		logger.Error("Failed to create debt asset", zap.Error(err))
		response.InternalError(c, "Failed to create debt asset")
		return
	}

	logger.Info("Debt asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// GetDebtAssets retrieves all debt assets
// @Summary List debt assets
// @Description Get all debt/liability assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=[]models.DebtAsset}
// @Router /api/assets/debt [get]
func GetDebtAssets(c *gin.Context) {
	var assets []models.DebtAsset
	db := database.GetDB()

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve debt assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve debt assets")
		return
	}

	response.Success(c, assets)
}

// GetDebtAsset retrieves a single debt asset by ID
// @Summary Get debt asset
// @Description Get a debt/liability asset by ID
// @Tags assets
// @Produce json
// @Param id path int true "Debt Asset ID"
// @Success 200 {object} response.Response{data=models.DebtAsset}
// @Router /api/assets/debt/{id} [get]
func GetDebtAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var asset models.DebtAsset
	db := database.GetDB()

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Debt asset not found", zap.Error(err))
		response.NotFound(c, "Debt asset not found")
		return
	}

	response.Success(c, asset)
}

// UpdateDebtAsset updates an existing debt asset
// @Summary Update debt asset
// @Description Update a debt/liability asset
// @Tags assets
// @Accept json
// @Produce json
// @Param id path int true "Debt Asset ID"
// @Param asset body UpdateDebtAssetRequest true "Debt asset info"
// @Success 200 {object} response.Response{data=models.DebtAsset}
// @Router /api/assets/debt/{id} [put]
func UpdateDebtAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var req UpdateDebtAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var asset models.DebtAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Debt asset not found", zap.Error(err))
		response.NotFound(c, "Debt asset not found")
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
	if req.Creditor != nil {
		asset.Creditor = *req.Creditor
	}
	if req.InterestRate != nil {
		asset.InterestRate = req.InterestRate
	}
	if req.DueDate != nil {
		asset.DueDate = req.DueDate
	}

	if err := db.Save(&asset).Error; err != nil {
		logger.Error("Failed to update debt asset", zap.Error(err))
		response.InternalError(c, "Failed to update debt asset")
		return
	}

	logger.Info("Debt asset updated", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// DeleteDebtAsset deletes a debt asset
// @Summary Delete debt asset
// @Description Delete a debt/liability asset
// @Tags assets
// @Param id path int true "Debt Asset ID"
// @Success 200 {object} response.Response
// @Router /api/assets/debt/{id} [delete]
func DeleteDebtAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	db := database.GetDB()
	var asset models.DebtAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Debt asset not found", zap.Error(err))
		response.NotFound(c, "Debt asset not found")
		return
	}

	if err := db.Delete(&asset).Error; err != nil {
		logger.Error("Failed to delete debt asset", zap.Error(err))
		response.InternalError(c, "Failed to delete debt asset")
		return
	}

	logger.Info("Debt asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Debt asset deleted successfully"})
}
