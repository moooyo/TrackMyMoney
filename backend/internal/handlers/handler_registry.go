package handlers

import (
	"trackmymoney/internal/container"
)

// HandlerRegistry holds references to all handlers with their dependencies
type HandlerRegistry struct {
	container *container.Container

	CashAsset   *CashAssetHandler
	AssetSummary *AssetSummaryHandler
}

// NewHandlerRegistry creates a new handler registry with dependency injection
func NewHandlerRegistry(c *container.Container) *HandlerRegistry {
	return &HandlerRegistry{
		container: c,
		CashAsset: NewCashAssetHandler(c.CashAssetService),
		AssetSummary: NewAssetSummaryHandler(c.AssetService),
	}
}
