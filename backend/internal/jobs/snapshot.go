package jobs

import (
	"context"
	"fmt"

	"go.uber.org/zap"
	"gorm.io/gorm"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/internal/services"
	"trackmymoney/pkg/logger"
)

// DailySnapshotJob generates daily asset snapshots
type DailySnapshotJob struct {
	assetMarketService *services.AssetMarketService
	assetService       *services.AssetService
}

// NewDailySnapshotJob creates a new daily snapshot job
func NewDailySnapshotJob(assetMarketService *services.AssetMarketService, assetService *services.AssetService) *DailySnapshotJob {
	return &DailySnapshotJob{
		assetMarketService: assetMarketService,
		assetService:       assetService,
	}
}

// Name returns the job name
func (j *DailySnapshotJob) Name() string {
	return "daily_snapshot"
}

// Execute runs the job
func (j *DailySnapshotJob) Execute(ctx context.Context) error {
	logger.Info("Starting daily snapshot job")
	db := database.GetDB()

	// Use database transaction to ensure atomicity
	err := db.Transaction(func(tx *gorm.DB) error {
		// Step 1: Refresh stock asset prices
		if err := j.refreshStockPrices(ctx, tx); err != nil {
			logger.Warn("Failed to refresh stock prices", zap.Error(err))
			// Continue even if refresh fails - use existing prices
		}

		// Step 2: Refresh crypto asset prices
		if err := j.refreshCryptoPrices(ctx, tx); err != nil {
			logger.Warn("Failed to refresh crypto prices", zap.Error(err))
			// Continue even if refresh fails - use existing prices
		}

		// Step 3: Calculate asset summary using AssetService
		summary, err := j.assetService.CalculateAssetSummary()
		if err != nil {
			return fmt.Errorf("failed to calculate asset summary: %w", err)
		}

		// Step 4: Save asset history using AssetService
		if err := j.assetService.SaveAssetHistory(summary); err != nil {
			return fmt.Errorf("failed to save asset history: %w", err)
		}

		logger.Info("Daily snapshot job completed successfully",
			zap.Float64("total_assets", summary.TotalAssets),
			zap.Float64("total_debt", summary.TotalDebt),
			zap.Float64("net_assets", summary.NetAssets))

		return nil
	})

	return err
}

// refreshStockPrices refreshes all stock asset prices
func (j *DailySnapshotJob) refreshStockPrices(ctx context.Context, db *gorm.DB) error {
	var stockAssets []models.StockAsset
	if err := db.Find(&stockAssets).Error; err != nil {
		return err
	}

	if len(stockAssets) == 0 {
		logger.Debug("No stock assets to refresh")
		return nil
	}

	updated, failed, err := j.assetMarketService.UpdateStockAssetsPrices(stockAssets)
	if err != nil {
		return err
	}

	// Save updated prices
	for i := range stockAssets {
		if err := db.Model(&stockAssets[i]).Update("current_price", stockAssets[i].CurrentPrice).Error; err != nil {
			logger.Warn("Failed to update stock asset price",
				zap.Uint("asset_id", stockAssets[i].ID),
				zap.Error(err))
		}
	}

	logger.Info("Stock prices refreshed",
		zap.Int("total", len(stockAssets)),
		zap.Int("updated", updated),
		zap.Int("failed", len(failed)))

	if len(failed) > 0 {
		logger.Warn("Some stock prices failed to refresh", zap.Strings("symbols", failed))
	}

	return nil
}

// refreshCryptoPrices refreshes all crypto asset prices
func (j *DailySnapshotJob) refreshCryptoPrices(ctx context.Context, db *gorm.DB) error {
	var cryptoAssets []models.CryptoAsset
	if err := db.Find(&cryptoAssets).Error; err != nil {
		return err
	}

	if len(cryptoAssets) == 0 {
		logger.Debug("No crypto assets to refresh")
		return nil
	}

	updated, failed, err := j.assetMarketService.UpdateCryptoAssetsPrices(cryptoAssets)
	if err != nil {
		return err
	}

	// Save updated prices
	for i := range cryptoAssets {
		if err := db.Model(&cryptoAssets[i]).Update("current_price", cryptoAssets[i].CurrentPrice).Error; err != nil {
			logger.Warn("Failed to update crypto asset price",
				zap.Uint("asset_id", cryptoAssets[i].ID),
				zap.Error(err))
		}
	}

	logger.Info("Crypto prices refreshed",
		zap.Int("total", len(cryptoAssets)),
		zap.Int("updated", updated),
		zap.Int("failed", len(failed)))

	if len(failed) > 0 {
		logger.Warn("Some crypto prices failed to refresh", zap.Strings("symbols", failed))
	}

	return nil
}
