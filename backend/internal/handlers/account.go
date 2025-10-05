package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"trackmymoney/internal/database"
	"trackmymoney/internal/models"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// CreateAccountRequest represents the request body for creating an account
type CreateAccountRequest struct {
	Name               string               `json:"name" binding:"required"`
	Type               models.AccountType   `json:"type" binding:"required"`
	Description        string               `json:"description"`
	InitialAmount      float64              `json:"initial_amount" binding:"required"`
	CurrentAmount      float64              `json:"current_amount" binding:"required"`
	Currency           string               `json:"currency"`
	AccountDate        *time.Time           `json:"account_date"`
	ExpectedAnnualRate *float64             `json:"expected_annual_rate,omitempty"`
	Symbol             *string              `json:"symbol,omitempty"`
	Shares             *float64             `json:"shares,omitempty"`
	CryptoSymbol       *string              `json:"crypto_symbol,omitempty"`
	CryptoAmount       *float64             `json:"crypto_amount,omitempty"`
}

// UpdateAccountRequest represents the request body for updating an account
type UpdateAccountRequest struct {
	Name               *string              `json:"name"`
	Type               *models.AccountType  `json:"type"`
	Description        *string              `json:"description"`
	CurrentAmount      *float64             `json:"current_amount"`
	Currency           *string              `json:"currency"`
	ExpectedAnnualRate *float64             `json:"expected_annual_rate,omitempty"`
	Symbol             *string              `json:"symbol,omitempty"`
	Shares             *float64             `json:"shares,omitempty"`
	CryptoSymbol       *string              `json:"crypto_symbol,omitempty"`
	CryptoAmount       *float64             `json:"crypto_amount,omitempty"`
}

// CreateAccount creates a new account
// @Summary Create account
// @Description Create a new financial account
// @Tags accounts
// @Accept json
// @Produce json
// @Param account body CreateAccountRequest true "Account info"
// @Success 200 {object} response.Response{data=models.Account}
// @Router /api/accounts [post]
func CreateAccount(c *gin.Context) {
	var req CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	// Set default account date to now if not provided
	accountDate := time.Now()
	if req.AccountDate != nil {
		accountDate = *req.AccountDate
	}

	account := models.Account{
		Name:               req.Name,
		Type:               req.Type,
		Description:        req.Description,
		InitialAmount:      req.InitialAmount,
		CurrentAmount:      req.CurrentAmount,
		Currency:           req.Currency,
		AccountDate:        accountDate,
		ExpectedAnnualRate: req.ExpectedAnnualRate,
		Symbol:             req.Symbol,
		Shares:             req.Shares,
		CryptoSymbol:       req.CryptoSymbol,
		CryptoAmount:       req.CryptoAmount,
	}

	if account.Currency == "" {
		account.Currency = "CNY"
	}

	db := database.GetDB()
	if err := db.Create(&account).Error; err != nil {
		logger.Error("Failed to create account", zap.Error(err))
		response.InternalError(c, "Failed to create account")
		return
	}

	logger.Info("Account created", zap.Uint("id", account.ID))
	response.Success(c, account)
}

// GetAccounts retrieves all accounts
// @Summary List accounts
// @Description Get all financial accounts
// @Tags accounts
// @Produce json
// @Success 200 {object} response.Response{data=[]models.Account}
// @Router /api/accounts [get]
func GetAccounts(c *gin.Context) {
	var accounts []models.Account
	db := database.GetDB()

	if err := db.Find(&accounts).Error; err != nil {
		logger.Error("Failed to retrieve accounts", zap.Error(err))
		response.InternalError(c, "Failed to retrieve accounts")
		return
	}

	response.Success(c, accounts)
}

// GetAccount retrieves a single account by ID
// @Summary Get account
// @Description Get a financial account by ID
// @Tags accounts
// @Produce json
// @Param id path int true "Account ID"
// @Success 200 {object} response.Response{data=models.Account}
// @Router /api/accounts/{id} [get]
func GetAccount(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid account ID")
		return
	}

	var account models.Account
	db := database.GetDB()

	if err := db.First(&account, id).Error; err != nil {
		logger.Error("Account not found", zap.Error(err))
		response.NotFound(c, "Account not found")
		return
	}

	response.Success(c, account)
}

// UpdateAccount updates an existing account
// @Summary Update account
// @Description Update a financial account
// @Tags accounts
// @Accept json
// @Produce json
// @Param id path int true "Account ID"
// @Param account body UpdateAccountRequest true "Account info"
// @Success 200 {object} response.Response{data=models.Account}
// @Router /api/accounts/{id} [put]
func UpdateAccount(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid account ID")
		return
	}

	var req UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	db := database.GetDB()
	var account models.Account

	if err := db.First(&account, id).Error; err != nil {
		logger.Error("Account not found", zap.Error(err))
		response.NotFound(c, "Account not found")
		return
	}

	// Update fields if provided
	if req.Name != nil {
		account.Name = *req.Name
	}
	if req.Type != nil {
		account.Type = *req.Type
	}
	if req.Description != nil {
		account.Description = *req.Description
	}
	if req.CurrentAmount != nil {
		account.CurrentAmount = *req.CurrentAmount
	}
	if req.Currency != nil {
		account.Currency = *req.Currency
	}
	if req.ExpectedAnnualRate != nil {
		account.ExpectedAnnualRate = req.ExpectedAnnualRate
	}
	if req.Symbol != nil {
		account.Symbol = req.Symbol
	}
	if req.Shares != nil {
		account.Shares = req.Shares
	}
	if req.CryptoSymbol != nil {
		account.CryptoSymbol = req.CryptoSymbol
	}
	if req.CryptoAmount != nil {
		account.CryptoAmount = req.CryptoAmount
	}

	if err := db.Save(&account).Error; err != nil {
		logger.Error("Failed to update account", zap.Error(err))
		response.InternalError(c, "Failed to update account")
		return
	}

	logger.Info("Account updated", zap.Uint("id", account.ID))
	response.Success(c, account)
}

// DeleteAccount deletes an account
// @Summary Delete account
// @Description Delete a financial account
// @Tags accounts
// @Param id path int true "Account ID"
// @Success 200 {object} response.Response
// @Router /api/accounts/{id} [delete]
func DeleteAccount(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid account ID")
		return
	}

	db := database.GetDB()
	var account models.Account

	if err := db.First(&account, id).Error; err != nil {
		logger.Error("Account not found", zap.Error(err))
		response.NotFound(c, "Account not found")
		return
	}

	if err := db.Delete(&account).Error; err != nil {
		logger.Error("Failed to delete account", zap.Error(err))
		response.InternalError(c, "Failed to delete account")
		return
	}

	logger.Info("Account deleted", zap.Uint("id", uint(id)))
	response.Success(c, gin.H{"message": "Account deleted successfully"})
}
