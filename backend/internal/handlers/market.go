package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trackmymoney/internal/models"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/response"
)

var marketService *services.MarketService

// SetMarketService sets the market service instance
func SetMarketService(service *services.MarketService) {
	marketService = service
}

// GetQuote godoc
// @Summary Get real-time quote
// @Description Get real-time quote for a single stock or crypto symbol
// @Tags Market
// @Accept json
// @Produce json
// @Param symbol path string true "Stock or crypto symbol (e.g., AAPL, BTC-USD)"
// @Success 200 {object} response.Response{data=models.Quote}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /market/quote/{symbol} [get]
func GetQuote(c *gin.Context) {
	symbol := c.Param("symbol")

	quote, err := marketService.GetQuote(symbol)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, quote)
}

// GetQuotes godoc
// @Summary Get batch quotes
// @Description Get quotes for multiple symbols at once
// @Tags Market
// @Accept json
// @Produce json
// @Param body body models.QuotesRequest true "Request body with symbols array"
// @Success 200 {object} response.Response{data=models.QuotesResponse}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /market/quotes [post]
func GetQuotes(c *gin.Context) {
	var req models.QuotesRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	quotes, err := marketService.GetQuotes(req.Symbols)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, quotes)
}

// GetHistory godoc
// @Summary Get historical price data
// @Description Get historical price data for a stock or crypto
// @Tags Market
// @Accept json
// @Produce json
// @Param symbol path string true "Stock or crypto symbol"
// @Param period query string false "Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)" default(1mo)
// @Param interval query string false "Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)" default(1d)
// @Success 200 {object} response.Response{data=models.HistoryResponse}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /market/history/{symbol} [get]
func GetHistory(c *gin.Context) {
	symbol := c.Param("symbol")
	period := c.DefaultQuery("period", "1mo")
	interval := c.DefaultQuery("interval", "1d")

	history, err := marketService.GetHistory(symbol, period, interval)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, history)
}

// GetInfo godoc
// @Summary Get stock/crypto information
// @Description Get basic information about a stock or cryptocurrency
// @Tags Market
// @Accept json
// @Produce json
// @Param symbol path string true "Stock or crypto symbol"
// @Success 200 {object} response.Response{data=models.InfoResponse}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /market/info/{symbol} [get]
func GetInfo(c *gin.Context) {
	symbol := c.Param("symbol")

	info, err := marketService.GetInfo(symbol)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, info)
}

// SearchMarket godoc
// @Summary Search stocks/crypto
// @Description Search for stocks or cryptocurrencies by name or symbol
// @Tags Market
// @Accept json
// @Produce json
// @Param q query string true "Search query" minlength(1)
// @Param limit query int false "Maximum number of results" default(10) minimum(1) maximum(50)
// @Success 200 {object} response.Response{data=models.SearchResponse}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /market/search [get]
func SearchMarket(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.Error(c, http.StatusBadRequest, "Query parameter 'q' is required")
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	results, err := marketService.Search(query, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, results)
}
