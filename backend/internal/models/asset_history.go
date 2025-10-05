package models

import "time"

// AssetHistory represents historical asset data
type AssetHistory struct {
	BaseModel
	Date         time.Time `gorm:"type:date;not null;index" json:"date"`
	TotalAssets  float64   `gorm:"type:decimal(20,2);not null" json:"total_assets"`
	TotalDebt    float64   `gorm:"type:decimal(20,2);not null" json:"total_debt"`
	NetAssets    float64   `gorm:"type:decimal(20,2);not null" json:"net_assets"`

	// Category breakdown (stored as JSON for flexibility)
	CategoryBreakdown string `gorm:"type:text" json:"category_breakdown"`
}

// AssetSnapshot represents a snapshot of an asset at a specific time
type AssetSnapshot struct {
	BaseModel
	AssetType AssetType `gorm:"type:varchar(50);not null;index" json:"asset_type"` // Type of asset (cash, stock, etc.)
	AssetID   uint      `gorm:"not null;index" json:"asset_id"`                    // ID of the specific asset
	Date      time.Time `gorm:"type:date;not null;index" json:"date"`
	Amount    float64   `gorm:"type:decimal(20,2);not null" json:"amount"` // Value at snapshot time
}
