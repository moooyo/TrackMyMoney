"""Historical price data models"""

from typing import Optional
from pydantic import BaseModel, Field


class HistoryDataPoint(BaseModel):
    """Single historical data point"""

    date: str = Field(..., description="Date in YYYY-MM-DD format or ISO datetime for intraday")
    timestamp: Optional[int] = Field(None, description="Unix timestamp in milliseconds")
    open: Optional[float] = Field(None, description="Opening price")
    high: Optional[float] = Field(None, description="Highest price")
    low: Optional[float] = Field(None, description="Lowest price")
    close: Optional[float] = Field(None, description="Closing price")
    volume: Optional[int] = Field(None, description="Trading volume")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2025-09-01",
                "timestamp": 1725148800000,
                "open": 148.5,
                "high": 151.2,
                "low": 147.8,
                "close": 150.5,
                "volume": 45000000,
            }
        }


class HistoryResponse(BaseModel):
    """Historical price data response"""

    symbol: str = Field(..., description="Stock or crypto symbol")
    period: str = Field(..., description="Time period (e.g., 1d, 5d, 1mo, 1y)")
    interval: str = Field(..., description="Data interval (e.g., 1m, 5m, 1h, 1d)")
    currency: Optional[str] = Field(None, description="Currency code")
    data_points: list[HistoryDataPoint] = Field(default_factory=list, description="Historical data points")

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "period": "1mo",
                "interval": "1d",
                "currency": "USD",
                "data_points": [
                    {
                        "date": "2025-09-01",
                        "timestamp": 1725148800000,
                        "open": 148.5,
                        "high": 151.2,
                        "low": 147.8,
                        "close": 150.5,
                        "volume": 45000000,
                    }
                ],
            }
        }


class InfoResponse(BaseModel):
    """Stock/crypto basic information"""

    symbol: str = Field(..., description="Symbol")
    name: Optional[str] = Field(None, description="Asset name")
    sector: Optional[str] = Field(None, description="Business sector")
    industry: Optional[str] = Field(None, description="Industry")
    market_cap: Optional[int] = Field(None, description="Market capitalization")
    description: Optional[str] = Field(None, description="Company/asset description")
    currency: Optional[str] = Field(None, description="Currency code")
    website: Optional[str] = Field(None, description="Official website")
    country: Optional[str] = Field(None, description="Country")

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology",
                "industry": "Consumer Electronics",
                "market_cap": 2500000000000,
                "description": "Apple Inc. designs, manufactures, and markets smartphones...",
                "currency": "USD",
                "website": "https://www.apple.com",
                "country": "United States",
            }
        }


class SearchResult(BaseModel):
    """Search result item"""

    symbol: str = Field(..., description="Symbol")
    name: Optional[str] = Field(None, description="Asset name")
    exchange: Optional[str] = Field(None, description="Exchange")
    asset_type: Optional[str] = Field(None, description="Asset type (stock, crypto, etf, etc.)")

    class Config:
        json_schema_extra = {
            "example": {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "asset_type": "EQUITY"}
        }


class SearchResponse(BaseModel):
    """Search results"""

    query: str = Field(..., description="Search query")
    results: list[SearchResult] = Field(default_factory=list, description="Search results")
    count: int = Field(..., description="Number of results")
