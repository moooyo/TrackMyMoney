package services

import (
	"trackmymoney/internal/models"
	"trackmymoney/internal/repository"
)

// CashAssetService handles business logic for cash assets
type CashAssetService struct {
	repo *repository.AssetRepository
}

// NewCashAssetService creates a new cash asset service
func NewCashAssetService(repo *repository.AssetRepository) *CashAssetService {
	return &CashAssetService{
		repo: repo,
	}
}

// GetAll retrieves all cash assets
func (s *CashAssetService) GetAll() ([]models.CashAsset, error) {
	return s.repo.GetAllCashAssets()
}

// GetByID retrieves a cash asset by ID
func (s *CashAssetService) GetByID(id uint) (*models.CashAsset, error) {
	return s.repo.GetCashAssetByID(id)
}

// Create creates a new cash asset with default values
func (s *CashAssetService) Create(asset *models.CashAsset) error {
	// Business logic: set default currency if not provided
	if asset.Currency == "" {
		asset.Currency = "CNY"
	}

	return s.repo.CreateCashAsset(asset)
}

// Update updates an existing cash asset
func (s *CashAssetService) Update(id uint, updates map[string]interface{}) (*models.CashAsset, error) {
	// Get existing asset
	asset, err := s.repo.GetCashAssetByID(id)
	if err != nil {
		return nil, err
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok {
		asset.Name = name
	}
	if amount, ok := updates["amount"].(float64); ok {
		asset.Amount = amount
	}
	if currency, ok := updates["currency"].(string); ok {
		asset.Currency = currency
	}
	if description, ok := updates["description"].(string); ok {
		asset.Description = description
	}

	if err := s.repo.UpdateCashAsset(asset); err != nil {
		return nil, err
	}

	return asset, nil
}

// Delete deletes a cash asset
func (s *CashAssetService) Delete(id uint) error {
	// Check if asset exists
	if _, err := s.repo.GetCashAssetByID(id); err != nil {
		return err
	}

	return s.repo.DeleteCashAsset(id)
}
