package models

import "time"

// AssetType represents the type of asset
type AssetType string

const (
	AssetTypeCash             AssetType = "cash"
	AssetTypeInterestBearing  AssetType = "interest_bearing"
	AssetTypeStock            AssetType = "stock"
	AssetTypeDebt             AssetType = "debt"
	AssetTypeCrypto           AssetType = "crypto"
)

// CashAsset represents a cash asset
type CashAsset struct {
	BaseModel
	Name        string  `gorm:"type:varchar(255);not null" json:"name"`
	Amount      float64 `gorm:"type:decimal(20,2);not null" json:"amount"`
	Currency    string  `gorm:"type:varchar(10);default:'CNY'" json:"currency"`
	Description string  `gorm:"type:text" json:"description"`
}

// TableName specifies the table name for CashAsset
func (CashAsset) TableName() string {
	return "cash_assets"
}

// InterestBearingAsset represents an interest-bearing asset (e.g., time deposit, bonds)
type InterestBearingAsset struct {
	BaseModel
	Name         string     `gorm:"type:varchar(255);not null" json:"name"`
	Amount       float64    `gorm:"type:decimal(20,2);not null" json:"amount"`
	Currency     string     `gorm:"type:varchar(10);default:'CNY'" json:"currency"`
	Description  string     `gorm:"type:text" json:"description"`
	InterestRate float64    `gorm:"type:decimal(5,4);not null" json:"interest_rate"` // Annual interest rate in percentage
	StartDate    time.Time  `gorm:"not null" json:"start_date"`
	MaturityDate *time.Time `json:"maturity_date,omitempty"`
}

// TableName specifies the table name for InterestBearingAsset
func (InterestBearingAsset) TableName() string {
	return "interest_bearing_assets"
}

// StockAsset represents a stock/ETF asset
type StockAsset struct {
	BaseModel
	Name          string  `gorm:"type:varchar(255);not null" json:"name"`
	Description   string  `gorm:"type:text" json:"description"`
	BrokerAccount string  `gorm:"type:varchar(255);not null" json:"broker_account"`
	Symbol        string  `gorm:"type:varchar(50);not null" json:"symbol"`
	Quantity      float64 `gorm:"type:decimal(20,8);not null" json:"quantity"`
	PurchasePrice float64 `gorm:"type:decimal(20,2);not null" json:"purchase_price"` // Average purchase price
	CurrentPrice  float64 `gorm:"type:decimal(20,2)" json:"current_price"`           // Can be updated from market API
	Currency      string  `gorm:"type:varchar(10);default:'CNY'" json:"currency"`
}

// TableName specifies the table name for StockAsset
func (StockAsset) TableName() string {
	return "stock_assets"
}

// DebtAsset represents a debt/liability
type DebtAsset struct {
	BaseModel
	Name         string     `gorm:"type:varchar(255);not null" json:"name"`
	Amount       float64    `gorm:"type:decimal(20,2);not null" json:"amount"` // Negative value for liabilities
	Currency     string     `gorm:"type:varchar(10);default:'CNY'" json:"currency"`
	Description  string     `gorm:"type:text" json:"description"`
	Creditor     string     `gorm:"type:varchar(255);not null" json:"creditor"`
	InterestRate *float64   `gorm:"type:decimal(5,4)" json:"interest_rate,omitempty"`
	DueDate      *time.Time `json:"due_date,omitempty"`
}

// TableName specifies the table name for DebtAsset
func (DebtAsset) TableName() string {
	return "debt_assets"
}

// CryptoAsset represents a cryptocurrency asset
type CryptoAsset struct {
	BaseModel
	Name          string  `gorm:"type:varchar(255);not null" json:"name"`
	Description   string  `gorm:"type:text" json:"description"`
	Symbol        string  `gorm:"type:varchar(50);not null" json:"symbol"` // e.g., BTC, ETH
	Quantity      float64 `gorm:"type:decimal(20,8);not null" json:"quantity"`
	PurchasePrice float64 `gorm:"type:decimal(20,2);not null" json:"purchase_price"` // Average purchase price
	CurrentPrice  float64 `gorm:"type:decimal(20,2)" json:"current_price"`           // Can be updated from market API
}

// TableName specifies the table name for CryptoAsset
func (CryptoAsset) TableName() string {
	return "crypto_assets"
}
