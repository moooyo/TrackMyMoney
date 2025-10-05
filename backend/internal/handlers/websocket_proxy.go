package handlers

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"trackmymoney/pkg/logger"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow all origins for WebSocket proxy
			return true
		},
	}
)

// ProxyMarketWebSocket godoc
// @Summary WebSocket proxy for market data
// @Description Proxy WebSocket connection to yfinanceAPI service
// @Tags Market
// @Accept json
// @Produce json
// @Param symbol path string true "Stock or crypto symbol to subscribe"
// @Success 101 {string} string "Switching Protocols"
// @Router /ws/market/{symbol} [get]
func ProxyMarketWebSocket(c *gin.Context) {
	// Get symbol from path
	symbol := c.Param("symbol")
	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "symbol is required"})
		return
	}

	// Build yfinanceAPI WebSocket URL
	yfinanceURL := "ws://127.0.0.1:5000/ws/market/" + url.PathEscape(symbol)

	// Upgrade client connection
	clientConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error("Failed to upgrade client connection", zap.Error(err))
		return
	}
	defer clientConn.Close()

	// Connect to yfinanceAPI WebSocket
	yfinanceConn, _, err := websocket.DefaultDialer.Dial(yfinanceURL, nil)
	if err != nil {
		logger.Error("Failed to connect to yfinanceAPI WebSocket",
			zap.String("url", yfinanceURL),
			zap.Error(err))
		clientConn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Failed to connect to market service"))
		return
	}
	defer yfinanceConn.Close()

	logger.Info("WebSocket proxy established",
		zap.String("symbol", symbol),
		zap.String("client_remote", c.Request.RemoteAddr))

	// Create channels for error handling
	errChan := make(chan error, 2)

	// Proxy: yfinanceAPI -> client
	go func() {
		for {
			messageType, message, err := yfinanceConn.ReadMessage()
			if err != nil {
				if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					logger.Error("Error reading from yfinanceAPI",
						zap.String("symbol", symbol),
						zap.Error(err))
				}
				errChan <- err
				return
			}

			if err := clientConn.WriteMessage(messageType, message); err != nil {
				logger.Error("Error writing to client",
					zap.String("symbol", symbol),
					zap.Error(err))
				errChan <- err
				return
			}
		}
	}()

	// Proxy: client -> yfinanceAPI
	go func() {
		for {
			messageType, message, err := clientConn.ReadMessage()
			if err != nil {
				if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					logger.Error("Error reading from client",
						zap.String("symbol", symbol),
						zap.Error(err))
				}
				errChan <- err
				return
			}

			if err := yfinanceConn.WriteMessage(messageType, message); err != nil {
				logger.Error("Error writing to yfinanceAPI",
					zap.String("symbol", symbol),
					zap.Error(err))
				errChan <- err
				return
			}
		}
	}()

	// Wait for either connection to close
	err = <-errChan
	if err != nil && !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
		logger.Warn("WebSocket proxy closed with error",
			zap.String("symbol", symbol),
			zap.Error(err))
	} else {
		logger.Info("WebSocket proxy closed normally",
			zap.String("symbol", symbol))
	}
}

// GetMarketWebSocketURL godoc
// @Summary Get WebSocket URL for market data
// @Description Get the WebSocket URL for subscribing to real-time market data
// @Tags Market
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /market/ws-url [get]
func GetMarketWebSocketURL(c *gin.Context) {
	// Get host from request
	host := c.Request.Host
	scheme := "ws"

	// Check if request is over HTTPS
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "wss"
	}

	// Remove port if it's the default
	if strings.Contains(host, ":") {
		parts := strings.Split(host, ":")
		if parts[1] == "80" || parts[1] == "443" {
			host = parts[0]
		}
	}

	wsURL := scheme + "://" + host + "/ws/market/{symbol}"

	c.JSON(http.StatusOK, gin.H{
		"ws_url": wsURL,
		"example": scheme + "://" + host + "/ws/market/AAPL",
	})
}
