package main

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/config"
	"trackmymoney/internal/database"
	"trackmymoney/internal/handlers"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
)

// @title TrackMyMoney API
// @version 1.0
// @description 资金收益追踪系统 API 文档
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load config
	cfg, err := config.Load("config.yaml")
	if err != nil {
		panic("failed to load config: " + err.Error())
	}

	// Initialize logger
	if err := logger.Init(&cfg.Log); err != nil {
		panic("failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting TrackMyMoney API server")

	// Initialize database
	if err := database.Init(&cfg.Database); err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer database.Close()

	logger.Info("Database initialized successfully")

	// Set config for auth handlers
	handlers.SetConfig(cfg)

	// Initialize market service
	marketService := services.NewMarketService(services.MarketServiceConfig{
		BaseURL:    cfg.Market.BaseURL,
		Timeout:    cfg.Market.Timeout,
		MaxRetries: cfg.Market.MaxRetries,
	})
	handlers.SetMarketService(marketService)
	logger.Info("Market service initialized", zap.String("base_url", cfg.Market.BaseURL))

	// Initialize asset market service
	assetMarketService := services.NewAssetMarketService(marketService)
	handlers.SetAssetMarketService(assetMarketService)
	logger.Info("Asset market service initialized")

	// Initialize watchlist service
	watchlistService := services.NewWatchlistService(marketService)
	handlers.SetWatchlistService(watchlistService)
	logger.Info("Watchlist service initialized")

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Create Gin router
	r := gin.Default()

	// Setup routes
	setupRoutes(r)

	// Start server
	logger.Info("Server listening", zap.String("port", cfg.Server.Port))
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func setupRoutes(r *gin.Engine) {
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		logger.Debug("Health check requested")
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Asset routes
		assets := api.Group("/assets")
		{
			// Cash assets
			cash := assets.Group("/cash")
			{
				cash.POST("", handlers.CreateCashAsset)
				cash.GET("", handlers.GetCashAssets)
				cash.GET("/:id", handlers.GetCashAsset)
				cash.PUT("/:id", handlers.UpdateCashAsset)
				cash.DELETE("/:id", handlers.DeleteCashAsset)
			}

			// Interest-bearing assets
			interestBearing := assets.Group("/interest-bearing")
			{
				interestBearing.POST("", handlers.CreateInterestBearingAsset)
				interestBearing.GET("", handlers.GetInterestBearingAssets)
				interestBearing.GET("/:id", handlers.GetInterestBearingAsset)
				interestBearing.PUT("/:id", handlers.UpdateInterestBearingAsset)
				interestBearing.DELETE("/:id", handlers.DeleteInterestBearingAsset)
			}

			// Stock assets
			stock := assets.Group("/stock")
			{
				stock.POST("", handlers.CreateStockAsset)
				stock.GET("", handlers.GetStockAssets)
				stock.GET("/:id", handlers.GetStockAsset)
				stock.PUT("/:id", handlers.UpdateStockAsset)
				stock.DELETE("/:id", handlers.DeleteStockAsset)
				stock.POST("/refresh-prices", handlers.RefreshStockAssetsPrices)
			}

			// Debt assets
			debt := assets.Group("/debt")
			{
				debt.POST("", handlers.CreateDebtAsset)
				debt.GET("", handlers.GetDebtAssets)
				debt.GET("/:id", handlers.GetDebtAsset)
				debt.PUT("/:id", handlers.UpdateDebtAsset)
				debt.DELETE("/:id", handlers.DeleteDebtAsset)
			}

			// Crypto assets
			crypto := assets.Group("/crypto")
			{
				crypto.POST("", handlers.CreateCryptoAsset)
				crypto.GET("", handlers.GetCryptoAssets)
				crypto.GET("/:id", handlers.GetCryptoAsset)
				crypto.PUT("/:id", handlers.UpdateCryptoAsset)
				crypto.DELETE("/:id", handlers.DeleteCryptoAsset)
				crypto.POST("/refresh-prices", handlers.RefreshCryptoAssetsPrices)
			}

			// Summary and history
			assets.GET("/summary", handlers.GetAssetsSummary)
			assets.GET("/history", handlers.GetAssetsHistory)
		}

		// Market routes
		market := api.Group("/market")
		{
			market.GET("/quote/:symbol", handlers.GetQuote)
			market.POST("/quotes", handlers.GetQuotes)
			market.GET("/history/:symbol", handlers.GetHistory)
			market.GET("/info/:symbol", handlers.GetInfo)
			market.GET("/search", handlers.SearchMarket)
		}

		// Watchlist routes
		watchlist := api.Group("/watchlist")
		{
			watchlist.POST("", handlers.CreateWatchlist)
			watchlist.GET("", handlers.GetWatchlist)
			watchlist.GET("/quotes", handlers.GetWatchlistWithQuotes)
			watchlist.GET("/:id", handlers.GetWatchlistItem)
			watchlist.PUT("/:id", handlers.UpdateWatchlist)
			watchlist.DELETE("/:id", handlers.DeleteWatchlist)
		}

		// Notification routes
		notifications := api.Group("/notifications")
		{
			notifications.POST("", handlers.CreateNotification)
			notifications.GET("", handlers.GetNotifications)
			notifications.GET("/:id", handlers.GetNotification)
			notifications.PUT("/:id", handlers.UpdateNotification)
			notifications.DELETE("/:id", handlers.DeleteNotification)
		}

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.GET("/verify", handlers.VerifyToken)
		}
	}
}
