package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/models"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// CashAssetHandler handles cash asset requests
type CashAssetHandler struct {
	service *services.CashAssetService
}

// NewCashAssetHandler creates a new cash asset handler
func NewCashAssetHandler(service *services.CashAssetService) *CashAssetHandler {
	return &CashAssetHandler{
		service: service,
	}
}

// Legacy global variable for backward compatibility (will be removed)
var globalCashAssetService *services.CashAssetService

// SetCashAssetService sets the global cash asset service instance (deprecated)
func SetCashAssetService(service *services.CashAssetService) {
	globalCashAssetService = service
}

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

// Create creates a new cash asset (method for dependency injection)
func (h *CashAssetHandler) Create(c *gin.Context) {
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

	if err := h.service.Create(&asset); err != nil {
		logger.Error("Failed to create cash asset", zap.Error(err))
		response.InternalError(c, "Failed to create cash asset")
		return
	}

	logger.Info("Cash asset created", zap.Uint("id", asset.ID))
	response.Success(c, asset)
}

// CreateCashAsset creates a new cash asset (legacy global function)
// @Summary Create cash asset
// @Description Create a new cash asset
// @Tags assets
// @Accept json
// @Produce json
// @Param asset body CreateCashAssetRequest true "Cash asset info"
// @Success 200 {object} response.Response{data=models.CashAsset}
// @Router /api/assets/cash [post]
func CreateCashAsset(c *gin.Context) {
	if globalCashAssetService == nil {
		logger.Error("CashAssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

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

	if err := globalCashAssetService.Create(&asset); err != nil {
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
	if globalCashAssetService == nil {
		logger.Error("CashAssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	assets, err := globalCashAssetService.GetAll()
	if err != nil {
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
	if globalCashAssetService == nil {
		logger.Error("CashAssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	asset, err := globalCashAssetService.GetByID(uint(id))
	if err != nil {
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
	if globalCashAssetService == nil {
		logger.Error("CashAssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

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

	// Build updates map
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Amount != nil {
		updates["amount"] = *req.Amount
	}
	if req.Currency != nil {
		updates["currency"] = *req.Currency
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	asset, err := globalCashAssetService.Update(uint(id), updates)
	if err != nil {
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
	if globalCashAssetService == nil {
		logger.Error("CashAssetService not initialized")
		response.InternalError(c, "Service not available")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid asset ID")
		return
	}

	if err := globalCashAssetService.Delete(uint(id)); err != nil {
		logger.Error("Failed to delete cash asset", zap.Error(err))
		response.NotFound(c, "Cash asset not found")
		return
	}

	logger.Info("Cash asset deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Cash asset deleted successfully"})
}
