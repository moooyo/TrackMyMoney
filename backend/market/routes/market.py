"""Market API routes"""

from fastapi import APIRouter, HTTPException, Query
from models.response import ApiResponse
from models.quote import Quote, QuotesRequest, QuotesResponse
from models.history import HistoryResponse, InfoResponse, SearchResponse
from services.market_service import market_service

router = APIRouter(prefix="/api/market", tags=["Market"])


@router.get("/quote/{symbol}", response_model=ApiResponse[Quote])
async def get_quote(symbol: str):
    """
    Get real-time quote for a single stock or crypto

    Args:
        symbol: Stock or crypto symbol (e.g., AAPL, BTC-USD)

    Returns:
        Quote data
    """
    quote = market_service.get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol}")

    return ApiResponse.success(quote)


@router.post("/quotes", response_model=ApiResponse[QuotesResponse])
async def get_quotes(request: QuotesRequest):
    """
    Get quotes for multiple symbols

    Args:
        request: Request with list of symbols

    Returns:
        Batch quotes response
    """
    quotes_response = market_service.get_quotes(request.symbols)
    return ApiResponse.success(quotes_response)


@router.get("/history/{symbol}", response_model=ApiResponse[HistoryResponse])
async def get_history(
    symbol: str,
    period: str = Query(default="1mo", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)"),
    interval: str = Query(default="1d", description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)"),
):
    """
    Get historical price data

    Args:
        symbol: Stock or crypto symbol
        period: Time period (default: 1mo)
        interval: Data interval (default: 1d)

    Returns:
        Historical price data
    """
    history = market_service.get_history(symbol, period, interval)
    if not history:
        raise HTTPException(status_code=404, detail=f"No historical data found for: {symbol}")

    return ApiResponse.success(history)


@router.get("/info/{symbol}", response_model=ApiResponse[InfoResponse])
async def get_info(symbol: str):
    """
    Get basic information about a stock or crypto

    Args:
        symbol: Stock or crypto symbol

    Returns:
        Basic information
    """
    info = market_service.get_info(symbol)
    if not info:
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol}")

    return ApiResponse.success(info)


@router.get("/search", response_model=ApiResponse[SearchResponse])
async def search(
    q: str = Query(..., description="Search query", min_length=1),
    limit: int = Query(default=10, description="Maximum number of results", ge=1, le=50),
):
    """
    Search for stocks or crypto

    Args:
        q: Search query
        limit: Maximum number of results (default: 10, max: 50)

    Returns:
        Search results
    """
    results = market_service.search(q, limit)
    return ApiResponse.success(results)
