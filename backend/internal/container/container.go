package container

import (
	"gorm.io/gorm"
	"trackmymoney/internal/config"
	"trackmymoney/internal/repository"
	"trackmymoney/internal/scheduler"
	"trackmymoney/internal/services"
	"trackmymoney/internal/services/notification"
)

// Container holds all application dependencies
type Container struct {
	Config *config.Config
	DB     *gorm.DB

	// Repositories
	AssetRepo *repository.AssetRepository

	// Services
	AssetService       *services.AssetService
	CashAssetService   *services.CashAssetService
	MarketService      *services.MarketService
	AssetMarketService *services.AssetMarketService
	WatchlistService   *services.WatchlistService
	NotificationService *notification.Service

	// Scheduler
	Scheduler *scheduler.Scheduler
}

// NewContainer creates a new dependency injection container
func NewContainer(cfg *config.Config, db *gorm.DB) *Container {
	container := &Container{
		Config: cfg,
		DB:     db,
	}

	// Initialize repositories
	container.AssetRepo = repository.NewAssetRepository(db)

	// Initialize services
	container.AssetService = services.NewAssetService(db)
	container.CashAssetService = services.NewCashAssetService(container.AssetRepo)

	container.MarketService = services.NewMarketService(services.MarketServiceConfig{
		BaseURL:    cfg.Market.BaseURL,
		Timeout:    cfg.Market.Timeout,
		MaxRetries: cfg.Market.MaxRetries,
	})

	container.AssetMarketService = services.NewAssetMarketService(container.MarketService)
	container.WatchlistService = services.NewWatchlistService(container.MarketService)
	container.NotificationService = notification.NewService()

	// Initialize scheduler if enabled
	if cfg.Scheduler.Enabled {
		container.Scheduler = scheduler.New(scheduler.Config{
			Enabled:       cfg.Scheduler.Enabled,
			CheckInterval: cfg.Scheduler.CheckInterval,
			Timezone:      cfg.Scheduler.Timezone,
		})
	}

	return container
}

// Close cleans up resources
func (c *Container) Close() error {
	if c.Scheduler != nil {
		c.Scheduler.Stop()
	}
	return nil
}
