"""Quote data models"""

from typing import Optional
from pydantic import BaseModel, Field


class Quote(BaseModel):
    """Single stock/crypto quote data"""

    symbol: str = Field(..., description="Stock or crypto symbol (e.g., AAPL, BTC-USD)")
    name: Optional[str] = Field(None, description="Asset name")
    price: Optional[float] = Field(None, description="Current price")
    previous_close: Optional[float] = Field(None, description="Previous day closing price")
    change: Optional[float] = Field(None, description="Price change")
    change_percent: Optional[float] = Field(None, description="Price change percentage")
    volume: Optional[int] = Field(None, description="Trading volume")
    market_cap: Optional[int] = Field(None, description="Market capitalization")
    currency: Optional[str] = Field(None, description="Currency code (e.g., USD, CNY)")
    timestamp: Optional[int] = Field(None, description="Unix timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 150.25,
                "previous_close": 148.50,
                "change": 1.75,
                "change_percent": 1.18,
                "volume": 50000000,
                "market_cap": 2500000000000,
                "currency": "USD",
                "timestamp": 1728039000,
            }
        }


class QuotesRequest(BaseModel):
    """Request model for batch quotes"""

    symbols: list[str] = Field(..., description="List of symbols to query", min_length=1)

    class Config:
        json_schema_extra = {"example": {"symbols": ["AAPL", "MSFT", "BTC-USD", "ETH-USD"]}}


class QuotesResponse(BaseModel):
    """Response model for batch quotes"""

    quotes: list[Quote] = Field(..., description="List of quotes")
    success_count: int = Field(..., description="Number of successful queries")
    failed_symbols: list[str] = Field(default_factory=list, description="List of failed symbols")
