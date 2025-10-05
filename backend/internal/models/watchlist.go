package models

// Watchlist represents a user's watchlist item (stock or crypto they are tracking)
type Watchlist struct {
	BaseModel
	UserID    uint   `gorm:"index;not null" json:"user_id"`
	Symbol    string `gorm:"type:varchar(20);not null;index" json:"symbol"`
	Name      string `gorm:"type:varchar(100);not null" json:"name"`
	AssetType string `gorm:"type:varchar(20);not null;index" json:"asset_type"` // "stock", "etf", "crypto"
	Notes     string `gorm:"type:text" json:"notes"`
}

// TableName specifies the table name for Watchlist
func (Watchlist) TableName() string {
	return "watchlist"
}
