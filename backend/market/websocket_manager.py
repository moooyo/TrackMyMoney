"""WebSocket connection manager for real-time market data"""

import asyncio
import logging
from typing import Dict, Set
from fastapi import WebSocket
import yfinance as yf

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and Yahoo Finance subscriptions"""

    def __init__(self):
        """Initialize WebSocket manager"""
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.yf_websocket = None
        self.subscribed_symbols: Set[str] = set()
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, symbol: str):
        """
        Accept a new WebSocket connection and subscribe to symbol

        Args:
            websocket: FastAPI WebSocket instance
            symbol: Stock or crypto symbol to subscribe to
        """
        await websocket.accept()

        async with self.lock:
            if symbol not in self.active_connections:
                self.active_connections[symbol] = set()
            self.active_connections[symbol].add(websocket)

            # Subscribe to yfinance WebSocket if not already subscribed
            if symbol not in self.subscribed_symbols:
                await self._subscribe_to_yfinance(symbol)

        logger.info(f"WebSocket connected for {symbol}. Total connections: {len(self.active_connections[symbol])}")

    async def disconnect(self, websocket: WebSocket, symbol: str):
        """
        Remove WebSocket connection and unsubscribe if no more connections

        Args:
            websocket: FastAPI WebSocket instance
            symbol: Stock or crypto symbol
        """
        async with self.lock:
            if symbol in self.active_connections:
                self.active_connections[symbol].discard(websocket)

                # If no more connections for this symbol, unsubscribe
                if len(self.active_connections[symbol]) == 0:
                    del self.active_connections[symbol]
                    await self._unsubscribe_from_yfinance(symbol)

        logger.info(f"WebSocket disconnected for {symbol}")

    async def broadcast(self, symbol: str, message: dict):
        """
        Broadcast message to all connections subscribed to a symbol

        Args:
            symbol: Stock or crypto symbol
            message: Message data to broadcast
        """
        if symbol not in self.active_connections:
            return

        disconnected = set()

        for connection in self.active_connections[symbol]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {symbol}: {e}")
                disconnected.add(connection)

        # Clean up disconnected connections
        if disconnected:
            async with self.lock:
                self.active_connections[symbol] -= disconnected

    async def _subscribe_to_yfinance(self, symbol: str):
        """
        Subscribe to yfinance WebSocket for a symbol

        Args:
            symbol: Stock or crypto symbol
        """
        try:
            # Initialize yfinance WebSocket if not already done
            if self.yf_websocket is None:
                self.yf_websocket = yf.WebSocket()
                # Start listening in background
                asyncio.create_task(self._listen_to_yfinance())

            # Subscribe to symbol
            self.yf_websocket.subscribe([symbol])
            self.subscribed_symbols.add(symbol)
            logger.info(f"Subscribed to yfinance WebSocket for {symbol}")

        except Exception as e:
            logger.error(f"Error subscribing to yfinance for {symbol}: {e}")

    async def _unsubscribe_from_yfinance(self, symbol: str):
        """
        Unsubscribe from yfinance WebSocket for a symbol

        Args:
            symbol: Stock or crypto symbol
        """
        try:
            if self.yf_websocket and symbol in self.subscribed_symbols:
                self.yf_websocket.unsubscribe([symbol])
                self.subscribed_symbols.discard(symbol)
                logger.info(f"Unsubscribed from yfinance WebSocket for {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from yfinance for {symbol}: {e}")

    async def _listen_to_yfinance(self):
        """
        Listen to yfinance WebSocket messages and broadcast to clients
        """
        try:
            def message_handler(message):
                """Handle incoming yfinance WebSocket messages"""
                try:
                    # Extract symbol and data from message
                    symbol = message.get("id", "").upper()
                    if symbol in self.active_connections:
                        # Format message for frontend
                        formatted_message = {
                            "symbol": symbol,
                            "price": message.get("price"),
                            "change": message.get("change"),
                            "change_percent": message.get("changePercent"),
                            "volume": message.get("dayVolume"),
                            "timestamp": message.get("time"),
                        }
                        # Broadcast to all connected clients
                        asyncio.create_task(self.broadcast(symbol, formatted_message))

                except Exception as e:
                    logger.error(f"Error handling yfinance message: {e}")

            # Start listening
            if self.yf_websocket:
                self.yf_websocket.listen(message_handler)

        except Exception as e:
            logger.error(f"Error listening to yfinance WebSocket: {e}")

    async def close_all(self):
        """Close all WebSocket connections"""
        async with self.lock:
            for symbol in list(self.active_connections.keys()):
                for connection in self.active_connections[symbol]:
                    try:
                        await connection.close()
                    except Exception:
                        pass

            self.active_connections.clear()

            # Close yfinance WebSocket
            if self.yf_websocket:
                try:
                    self.yf_websocket.close()
                except Exception:
                    pass

        logger.info("All WebSocket connections closed")


# Global WebSocket manager instance
ws_manager = WebSocketManager()
