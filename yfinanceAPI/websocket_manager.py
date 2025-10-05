"""WebSocket connection manager for real-time market data"""

import asyncio
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket
import yfinance as yf

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and Yahoo Finance subscriptions"""

    def __init__(self):
        """Initialize WebSocket manager"""
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.yf_websocket: Optional[yf.AsyncWebSocket] = None
        self.subscribed_symbols: Set[str] = set()
        self.lock = asyncio.Lock()
        self.ws_task: Optional[asyncio.Task] = None
        self.running = False

    async def start_yfinance_websocket(self):
        """Start yfinance WebSocket connection and listen for messages"""
        retry_count = 0
        max_retries = 5

        while self.running and retry_count < max_retries:
            try:
                logger.info("Starting yfinance WebSocket connection...")

                async with yf.AsyncWebSocket() as ws:
                    self.yf_websocket = ws
                    retry_count = 0  # Reset retry count on successful connection

                    async def message_handler(message):
                        """Handle incoming yfinance WebSocket messages"""
                        try:
                            # Extract symbol and data from message
                            # yfinance message format: {'id': 'AAPL', 'price': 219.26, 'time': '1754589807000', ...}
                            symbol = message.get("id", "").upper()
                            if symbol in self.active_connections:
                                # Format message for frontend
                                formatted_message = {
                                    "symbol": symbol,
                                    "price": message.get("price"),
                                    "change_percent": message.get("change_percent"),
                                    "volume": message.get("day_volume"),
                                    "timestamp": message.get("time"),
                                }
                                # Broadcast to all connected clients
                                await self.broadcast(symbol, formatted_message)
                        except Exception as e:
                            logger.error(f"Error handling yfinance message: {e}")

                    # Subscribe to existing symbols
                    if self.subscribed_symbols:
                        logger.info(f"Subscribing to symbols: {self.subscribed_symbols}")
                        await ws.subscribe(list(self.subscribed_symbols))

                    # Start listening (this is a blocking call)
                    logger.info("yfinance WebSocket listening for messages...")
                    await ws.listen(message_handler)

            except asyncio.CancelledError:
                logger.info("yfinance WebSocket task cancelled")
                break
            except Exception as e:
                retry_count += 1
                logger.error(f"yfinance WebSocket error (attempt {retry_count}/{max_retries}): {e}")
                if retry_count < max_retries and self.running:
                    await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                else:
                    break

        self.yf_websocket = None
        logger.info("yfinance WebSocket connection closed")

    async def start(self):
        """Start the WebSocket manager"""
        if self.running:
            logger.warning("WebSocket manager already running")
            return

        self.running = True
        self.ws_task = asyncio.create_task(self.start_yfinance_websocket())
        logger.info("WebSocket manager started")

    async def stop(self):
        """Stop the WebSocket manager"""
        logger.info("Stopping WebSocket manager...")
        self.running = False

        if self.ws_task:
            self.ws_task.cancel()
            try:
                await self.ws_task
            except asyncio.CancelledError:
                pass

        await self.close_all()
        logger.info("WebSocket manager stopped")

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
            self.subscribed_symbols.add(symbol)

            # Subscribe to symbol if WebSocket is available
            if self.yf_websocket:
                await self.yf_websocket.subscribe([symbol])
                logger.info(f"Subscribed to yfinance WebSocket for {symbol}")
            else:
                logger.warning(f"yfinance WebSocket not ready, {symbol} will be subscribed when connected")

        except Exception as e:
            logger.error(f"Error subscribing to yfinance for {symbol}: {e}")

    async def _unsubscribe_from_yfinance(self, symbol: str):
        """
        Unsubscribe from yfinance WebSocket for a symbol

        Args:
            symbol: Stock or crypto symbol
        """
        try:
            if symbol in self.subscribed_symbols:
                self.subscribed_symbols.discard(symbol)

                if self.yf_websocket:
                    await self.yf_websocket.unsubscribe([symbol])
                    logger.info(f"Unsubscribed from yfinance WebSocket for {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from yfinance for {symbol}: {e}")

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
            self.subscribed_symbols.clear()

        logger.info("All WebSocket connections closed")


# Global WebSocket manager instance
ws_manager = WebSocketManager()
