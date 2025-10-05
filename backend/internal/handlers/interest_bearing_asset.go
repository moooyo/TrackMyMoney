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

// CreateInterestBearingAssetRequest represents the request body for creating an interest-bearing asset
type CreateInterestBearingAssetRequest struct {
	Name         string     `json:"name" binding:"required"`
	Amount       float64    `json:"amount" binding:"required"`
	Currency     string     `json:"currency"`
	Description  string     `json:"description"`
	InterestRate float64    `json:"interest_rate" binding:"required"` // Annual interest rate in percentage
	StartDate    *time.Time `json:"start_date" binding:"required"`
	MaturityDate *time.Time `json:"maturity_date,omitempty"`
}

// UpdateInterestBearingAssetRequest represents the request body for updating an interest-bearing asset
type UpdateInterestBearingAssetRequest struct {
	Name         *string    `json:"name"`
	Amount       *float64   `json:"amount"`
	Currency     *string    `json:"currency"`
	Description  *string    `json:"description"`
	InterestRate *float64   `json:"interest_rate"`
	StartDate    *time.Time `json:"start_date"`
	MaturityDate *time.Time `json:"maturity_date,omitempty"`
}

// CreateInterestBearingAsset creates a new interest-bearing asset
// @Summary Create interest-bearing asset
// @Description Create a new interest-bearing asset (time deposit, bond, etc.)
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateInterestBearingAssetRequest true "Interest-bearing asset info"
// @Success 200 {object} response.Response{data=models.InterestBearingAsset}
// @Router /api/assets/interest-bearing [post]
func CreateInterestBearingAsset(c *gin.Context) {
	var req CreateInterestBearingAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	startDate := time.Now()
	if req.StartDate != nil {
		startDate = *req.StartDate
	}

	asset := models.InterestBearingAsset{
		Name:         req.Name,
		Amount:       req.Amount,
		Currency:     req.Currency,
		Description:  req.Description,
		InterestRate: req.InterestRate,
		StartDate:    startDate,
		MaturityDate: req.MaturityDate,
	}

	if asset.Currency == "" {
		asset.Currency = "CNY"
	}

	db := database.GetDB()
	if err := db.Create(&asset).Error; err != nil {
		logger.Error("Failed to create interest-bearing asset", zap.Error(err))
		response.InternalError(c, "Failed to create interest-bearing asset")
		return
	}

	logger.Info("Interest-bearing asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// GetInterestBearingAssets retrieves all interest-bearing assets
// @Summary List interest-bearing assets
// @Description Get all interest-bearing assets
// @Tags assets
// @Produce json
// @Success 200 {object} response.Response{data=[]models.InterestBearingAsset}
// @Router /api/assets/interest-bearing [get]
func GetInterestBearingAssets(c *gin.Context) {
	var assets []models.InterestBearingAsset
	db := database.GetDB()

	if err := db.Find(&assets).Error; err != nil {
		logger.Error("Failed to retrieve interest-bearing assets", zap.Error(err))
		response.InternalError(c, "Failed to retrieve interest-bearing assets")
		return
	}

	response.Success(c, assets)
}

// GetInterestBearingAsset retrieves a single interest-bearing asset by ID
// @Summary Get interest-bearing asset
// @Description Get an interest-bearing asset by ID
// @Tags assets
// @Produce json
// @Param id path int true "Interest-Bearing Asset ID"
// @Success 200 {object} response.Response{data=models.InterestBearingAsset}
// @Router /api/assets/interest-bearing/{id} [get]
func GetInterestBearingAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var asset models.InterestBearingAsset
	db := database.GetDB()

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Interest-bearing asset not found", zap.Error(err))
		response.NotFound(c, "Interest-bearing asset not found")
		return
	}

	response.Success(c, asset)
}

// UpdateInterestBearingAsset updates an existing interest-bearing asset
// @Summary Update interest-bearing asset
// @Description Update an interest-bearing asset
// @Tags assets
// @Accept json
// @Produce json
// @Param id path int true "Interest-Bearing Asset ID"
// @Param asset body UpdateInterestBearingAssetRequest true "Interest-bearing asset info"
// @Success 200 {object} response.Response{data=models.InterestBearingAsset}
// @Router /api/assets/interest-bearing/{id} [put]
func UpdateInterestBearingAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	var req UpdateInterestBearingAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var asset models.InterestBearingAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Interest-bearing asset not found", zap.Error(err))
		response.NotFound(c, "Interest-bearing asset not found")
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
	if req.InterestRate != nil {
		asset.InterestRate = *req.InterestRate
	}
	if req.StartDate != nil {
		asset.StartDate = *req.StartDate
	}
	if req.MaturityDate != nil {
		asset.MaturityDate = req.MaturityDate
	}

	if err := db.Save(&asset).Error; err != nil {
		logger.Error("Failed to update interest-bearing asset", zap.Error(err))
		response.InternalError(c, "Failed to update interest-bearing asset")
		return
	}

	logger.Info("Interest-bearing asset updated", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// DeleteInterestBearingAsset deletes an interest-bearing asset
// @Summary Delete interest-bearing asset
// @Description Delete an interest-bearing asset
// @Tags assets
// @Param id path int true "Interest-Bearing Asset ID"
// @Success 200 {object} response.Response
// @Router /api/assets/interest-bearing/{id} [delete]
func DeleteInterestBearingAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	db := database.GetDB()
	var asset models.InterestBearingAsset

	if err := db.First(&asset, id).Error; err != nil {
		logger.Error("Interest-bearing asset not found", zap.Error(err))
		response.NotFound(c, "Interest-bearing asset not found")
		return
	}

	if err := db.Delete(&asset).Error; err != nil {
		logger.Error("Failed to delete interest-bearing asset", zap.Error(err))
		response.InternalError(c, "Failed to delete interest-bearing asset")
		return
	}

	logger.Info("Interest-bearing asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Interest-bearing asset deleted successfully"})
}
