package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trackmymoney/internal/models"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/response"
)

var watchlistService *services.WatchlistService

// SetWatchlistService sets the watchlist service instance
func SetWatchlistService(service *services.WatchlistService) {
	watchlistService = service
}

// CreateWatchlistRequest represents a request to create a watchlist item
type CreateWatchlistRequest struct {
	Symbol    string `json:"symbol" binding:"required"`
	Name      string `json:"name" binding:"required"`
	AssetType string `json:"asset_type" binding:"required"`
	Notes     string `json:"notes"`
}

// UpdateWatchlistRequest represents a request to update a watchlist item
type UpdateWatchlistRequest struct {
	Notes string `json:"notes"`
}

// CreateWatchlist godoc
// @Summary Create watchlist item
// @Description Add a new stock or crypto to user's watchlist
// @Tags Watchlist
// @Accept json
// @Produce json
// @Param body body CreateWatchlistRequest true "Watchlist item"
// @Success 200 {object} response.Response{data=models.Watchlist}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /watchlist [post]
func CreateWatchlist(c *gin.Context) {
	var req CreateWatchlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	// TODO: Get user ID from auth context
	// For now, use a fixed user ID
	userID := uint(1)

	watchlist := &models.Watchlist{
		UserID:    userID,
		Symbol:    req.Symbol,
		Name:      req.Name,
		AssetType: req.AssetType,
		Notes:     req.Notes,
	}

	if err := watchlistService.Create(watchlist); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, watchlist)
}

// GetWatchlist godoc
// @Summary Get user's watchlist
// @Description Get all watchlist items for the current user
// @Tags Watchlist
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]models.Watchlist}
// @Failure 500 {object} response.Response
// @Router /watchlist [get]
func GetWatchlist(c *gin.Context) {
	// TODO: Get user ID from auth context
	userID := uint(1)

	watchlist, err := watchlistService.GetByUserID(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, watchlist)
}

// GetWatchlistWithQuotes godoc
// @Summary Get watchlist with real-time quotes
// @Description Get all watchlist items with real-time market quotes
// @Tags Watchlist
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]map[string]interface{}}
// @Failure 500 {object} response.Response
// @Router /watchlist/quotes [get]
func GetWatchlistWithQuotes(c *gin.Context) {
	// TODO: Get user ID from auth context
	userID := uint(1)

	result, err := watchlistService.GetWatchlistWithQuotes(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, result)
}

// GetWatchlistItem godoc
// @Summary Get watchlist item by ID
// @Description Get a specific watchlist item by ID
// @Tags Watchlist
// @Accept json
// @Produce json
// @Param id path int true "Watchlist ID"
// @Success 200 {object} response.Response{data=models.Watchlist}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /watchlist/{id} [get]
func GetWatchlistItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	watchlist, err := watchlistService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Watchlist item not found")
		return
	}

	response.Success(c, watchlist)
}

// UpdateWatchlist godoc
// @Summary Update watchlist item
// @Description Update a watchlist item (currently only notes)
// @Tags Watchlist
// @Accept json
// @Produce json
// @Param id path int true "Watchlist ID"
// @Param body body UpdateWatchlistRequest true "Update data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /watchlist/{id} [put]
func UpdateWatchlist(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var req UpdateWatchlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	updates := map[string]interface{}{
		"notes": req.Notes,
	}

	if err := watchlistService.Update(uint(id), updates); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Watchlist item updated successfully"})
}

// DeleteWatchlist godoc
// @Summary Delete watchlist item
// @Description Remove a stock or crypto from user's watchlist
// @Tags Watchlist
// @Accept json
// @Produce json
// @Param id path int true "Watchlist ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /watchlist/{id} [delete]
func DeleteWatchlist(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := watchlistService.Delete(uint(id)); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Watchlist item deleted successfully"})
}
