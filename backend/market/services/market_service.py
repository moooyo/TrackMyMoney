"""Market data service using yfinance"""

import logging
from typing import Optional
from datetime import datetime

import yfinance as yf
from models.quote import Quote, QuotesResponse
from models.history import HistoryResponse, HistoryDataPoint, InfoResponse, SearchResponse, SearchResult

logger = logging.getLogger(__name__)


class MarketService:
    """Service for fetching market data from Yahoo Finance"""

    def __init__(self):
        """Initialize market service"""
        pass

    def get_quote(self, symbol: str) -> Optional[Quote]:
        """
        Get real-time quote for a single symbol

        Args:
            symbol: Stock or crypto symbol (e.g., AAPL, BTC-USD)

        Returns:
            Quote object or None if failed
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Check if ticker exists
            if not info or "symbol" not in info:
                logger.warning(f"Symbol not found: {symbol}")
                return None

            # Extract quote data
            current_price = info.get("currentPrice") or info.get("regularMarketPrice")
            previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")

            # Calculate change and change percent
            change = None
            change_percent = None
            if current_price and previous_close:
                change = round(current_price - previous_close, 2)
                change_percent = round((change / previous_close) * 100, 2)

            quote = Quote(
                symbol=symbol.upper(),
                name=info.get("longName") or info.get("shortName"),
                price=current_price,
                previous_close=previous_close,
                change=change,
                change_percent=change_percent,
                volume=info.get("volume") or info.get("regularMarketVolume"),
                market_cap=info.get("marketCap"),
                currency=info.get("currency") or info.get("financialCurrency"),
                timestamp=int(datetime.now().timestamp()),
            )

            return quote

        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return None

    def get_quotes(self, symbols: list[str]) -> QuotesResponse:
        """
        Get quotes for multiple symbols

        Args:
            symbols: List of stock or crypto symbols

        Returns:
            QuotesResponse with all quotes and status
        """
        quotes = []
        failed_symbols = []

        for symbol in symbols:
            quote = self.get_quote(symbol)
            if quote:
                quotes.append(quote)
            else:
                failed_symbols.append(symbol)

        return QuotesResponse(quotes=quotes, success_count=len(quotes), failed_symbols=failed_symbols)

    def get_history(
        self, symbol: str, period: str = "1mo", interval: str = "1d"
    ) -> Optional[HistoryResponse]:
        """
        Get historical price data

        Args:
            symbol: Stock or crypto symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            HistoryResponse or None if failed
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)

            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return None

            # Convert DataFrame to list of HistoryDataPoint
            data_points = []
            for date, row in hist.iterrows():
                # For intraday intervals, use ISO format with time; otherwise use date only
                is_intraday = interval in ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"]
                date_str = date.isoformat() if is_intraday else date.strftime("%Y-%m-%d")

                # Convert to Unix timestamp in milliseconds
                timestamp_ms = int(date.timestamp() * 1000)

                data_point = HistoryDataPoint(
                    date=date_str,
                    timestamp=timestamp_ms,
                    open=round(float(row["Open"]), 2) if not row.isna()["Open"] else None,
                    high=round(float(row["High"]), 2) if not row.isna()["High"] else None,
                    low=round(float(row["Low"]), 2) if not row.isna()["Low"] else None,
                    close=round(float(row["Close"]), 2) if not row.isna()["Close"] else None,
                    volume=int(row["Volume"]) if not row.isna()["Volume"] else None,
                )
                data_points.append(data_point)

            # Get currency from ticker info
            info = ticker.info
            currency = info.get("currency") or info.get("financialCurrency")

            return HistoryResponse(
                symbol=symbol.upper(),
                period=period,
                interval=interval,
                currency=currency,
                data_points=data_points,
            )

        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {e}")
            return None

    def get_info(self, symbol: str) -> Optional[InfoResponse]:
        """
        Get basic information about a stock or crypto

        Args:
            symbol: Stock or crypto symbol

        Returns:
            InfoResponse or None if failed
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            if not info or "symbol" not in info:
                logger.warning(f"Symbol not found: {symbol}")
                return None

            return InfoResponse(
                symbol=symbol.upper(),
                name=info.get("longName") or info.get("shortName"),
                sector=info.get("sector"),
                industry=info.get("industry"),
                market_cap=info.get("marketCap"),
                description=info.get("longBusinessSummary"),
                currency=info.get("currency") or info.get("financialCurrency"),
                website=info.get("website"),
                country=info.get("country"),
            )

        except Exception as e:
            logger.error(f"Error fetching info for {symbol}: {e}")
            return None

    def search(self, query: str, limit: int = 10) -> SearchResponse:
        """
        Search for stocks/crypto by name or symbol

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            SearchResponse with results
        """
        try:
            # yfinance doesn't have a built-in search, so we'll use the Ticker lookup
            # For a basic implementation, try to get info for the query as-is
            # In production, you might want to integrate with a proper search API

            results = []

            # Try exact symbol match
            try:
                ticker = yf.Ticker(query.upper())
                info = ticker.info
                if info and "symbol" in info:
                    result = SearchResult(
                        symbol=info.get("symbol", query.upper()),
                        name=info.get("longName") or info.get("shortName"),
                        exchange=info.get("exchange"),
                        asset_type=info.get("quoteType"),
                    )
                    results.append(result)
            except Exception:
                pass

            return SearchResponse(query=query, results=results, count=len(results))

        except Exception as e:
            logger.error(f"Error searching for {query}: {e}")
            return SearchResponse(query=query, results=[], count=0)


# Global service instance
market_service = MarketService()
