package models

import "time"

// AccountType represents the type of account
type AccountType string

const (
	AccountTypeCash                    AccountType = "cash"
	AccountTypeInterestBearingCash     AccountType = "interest_bearing_cash"
	AccountTypeStock                   AccountType = "stock"
	AccountTypeDebt                    AccountType = "debt"
	AccountTypeCrypto                  AccountType = "crypto"
)

// Account represents a financial account
type Account struct {
	BaseModel
	Name        string      `gorm:"type:varchar(255);not null" json:"name"`
	Type        AccountType `gorm:"type:varchar(50);not null" json:"type"`
	Description string      `gorm:"type:text" json:"description"`
	InitialAmount float64   `gorm:"type:decimal(20,2);not null" json:"initial_amount"`
	CurrentAmount float64   `gorm:"type:decimal(20,2);not null" json:"current_amount"`
	Currency    string      `gorm:"type:varchar(10);default:'CNY'" json:"currency"`
	AccountDate time.Time   `gorm:"not null" json:"account_date"`

	// For interest-bearing cash
	ExpectedAnnualRate *float64 `gorm:"type:decimal(5,4)" json:"expected_annual_rate,omitempty"`

	// For stocks/ETFs
	Symbol *string  `gorm:"type:varchar(50)" json:"symbol,omitempty"`
	Shares *float64 `gorm:"type:decimal(20,8)" json:"shares,omitempty"`

	// For crypto
	CryptoSymbol *string  `gorm:"type:varchar(50)" json:"crypto_symbol,omitempty"`
	CryptoAmount *float64 `gorm:"type:decimal(20,8)" json:"crypto_amount,omitempty"`
}
