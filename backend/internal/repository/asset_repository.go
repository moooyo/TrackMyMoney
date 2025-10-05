package repository

import (
	"gorm.io/gorm"
	"trackmymoney/internal/models"
)

// AssetRepository handles data access for all asset types
type AssetRepository struct {
	db *gorm.DB
}

// NewAssetRepository creates a new asset repository
func NewAssetRepository(db *gorm.DB) *AssetRepository {
	return &AssetRepository{
		db: db,
	}
}

// === Cash Asset Methods ===

func (r *AssetRepository) CreateCashAsset(asset *models.CashAsset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetAllCashAssets() ([]models.CashAsset, error) {
	var assets []models.CashAsset
	err := r.db.Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) GetCashAssetByID(id uint) (*models.CashAsset, error) {
	var asset models.CashAsset
	err := r.db.First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) UpdateCashAsset(asset *models.CashAsset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) DeleteCashAsset(id uint) error {
	return r.db.Delete(&models.CashAsset{}, id).Error
}

// === Interest-Bearing Asset Methods ===

func (r *AssetRepository) CreateInterestBearingAsset(asset *models.InterestBearingAsset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetAllInterestBearingAssets() ([]models.InterestBearingAsset, error) {
	var assets []models.InterestBearingAsset
	err := r.db.Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) GetInterestBearingAssetByID(id uint) (*models.InterestBearingAsset, error) {
	var asset models.InterestBearingAsset
	err := r.db.First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) UpdateInterestBearingAsset(asset *models.InterestBearingAsset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) DeleteInterestBearingAsset(id uint) error {
	return r.db.Delete(&models.InterestBearingAsset{}, id).Error
}

// === Stock Asset Methods ===

func (r *AssetRepository) CreateStockAsset(asset *models.StockAsset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetAllStockAssets() ([]models.StockAsset, error) {
	var assets []models.StockAsset
	err := r.db.Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) GetStockAssetByID(id uint) (*models.StockAsset, error) {
	var asset models.StockAsset
	err := r.db.First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) UpdateStockAsset(asset *models.StockAsset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) DeleteStockAsset(id uint) error {
	return r.db.Delete(&models.StockAsset{}, id).Error
}

// === Debt Asset Methods ===

func (r *AssetRepository) CreateDebtAsset(asset *models.DebtAsset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetAllDebtAssets() ([]models.DebtAsset, error) {
	var assets []models.DebtAsset
	err := r.db.Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) GetDebtAssetByID(id uint) (*models.DebtAsset, error) {
	var asset models.DebtAsset
	err := r.db.First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) UpdateDebtAsset(asset *models.DebtAsset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) DeleteDebtAsset(id uint) error {
	return r.db.Delete(&models.DebtAsset{}, id).Error
}

// === Crypto Asset Methods ===

func (r *AssetRepository) CreateCryptoAsset(asset *models.CryptoAsset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetAllCryptoAssets() ([]models.CryptoAsset, error) {
	var assets []models.CryptoAsset
	err := r.db.Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) GetCryptoAssetByID(id uint) (*models.CryptoAsset, error) {
	var asset models.CryptoAsset
	err := r.db.First(&asset, id).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) UpdateCryptoAsset(asset *models.CryptoAsset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) DeleteCryptoAsset(id uint) error {
	return r.db.Delete(&models.CryptoAsset{}, id).Error
}

// === Asset History Methods ===

func (r *AssetRepository) CreateAssetHistory(history *models.AssetHistory) error {
	return r.db.Create(history).Error
}

func (r *AssetRepository) GetAssetHistory(startDate, endDate interface{}) ([]models.AssetHistory, error) {
	var history []models.AssetHistory
	err := r.db.Where("date >= ? AND date <= ?", startDate, endDate).
		Order("date ASC").
		Find(&history).Error
	return history, err
}
