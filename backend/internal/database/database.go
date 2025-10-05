package database

import (
	"trackmymoney/internal/config"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"

	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Init initializes the database connection
func Init(cfg *config.DatabaseConfig) error {
	var err error

	// Open database connection
	DB, err = gorm.Open(sqlite.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		return err
	}

	logger.Info("Database connected successfully")

	// Auto migrate
	if err := AutoMigrate(); err != nil {
		return err
	}

	logger.Info("Database migration completed")

	return nil
}

// AutoMigrate runs database migrations
func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.CashAsset{},
		&models.InterestBearingAsset{},
		&models.StockAsset{},
		&models.DebtAsset{},
		&models.CryptoAsset{},
		&models.Notification{},
		&models.AssetHistory{},
		&models.AssetSnapshot{},
		&models.Watchlist{},
		&models.ScheduledJob{},
		&models.JobExecutionLog{},
	)
}

// Close closes the database connection
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	if DB == nil {
		logger.Fatal("Database not initialized", zap.String("error", "DB is nil"))
	}
	return DB
}
