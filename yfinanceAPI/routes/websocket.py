"""WebSocket routes for real-time market data"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/market/{symbol}")
async def market_websocket(websocket: WebSocket, symbol: str):
    """
    WebSocket endpoint for real-time market data

    Args:
        websocket: WebSocket connection
        symbol: Stock or crypto symbol to subscribe to (e.g., AAPL, BTC-USD)

    Example:
        ws://localhost:5000/ws/market/AAPL
    """
    symbol = symbol.upper()
    logger.info(f"WebSocket connection attempt for symbol: {symbol}")

    try:
        # Accept connection and subscribe to symbol
        await ws_manager.connect(websocket, symbol)

        # Send initial connection success message
        await websocket.send_json(
            {"type": "connection", "status": "connected", "symbol": symbol, "message": f"Subscribed to {symbol}"}
        )

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for client messages (e.g., ping, additional subscriptions)
                data = await websocket.receive_json()

                # Handle ping messages
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": data.get("timestamp")})

                # Handle subscription changes
                elif data.get("type") == "subscribe":
                    new_symbol = data.get("symbol", "").upper()
                    if new_symbol:
                        await ws_manager.disconnect(websocket, symbol)
                        symbol = new_symbol
                        await ws_manager.connect(websocket, symbol)
                        await websocket.send_json(
                            {
                                "type": "subscription_changed",
                                "symbol": symbol,
                                "message": f"Switched to {symbol}",
                            }
                        )

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for {symbol}")
                break
            except Exception as e:
                logger.error(f"Error receiving message for {symbol}: {e}")
                break

    except Exception as e:
        logger.error(f"WebSocket error for {symbol}: {e}")

    finally:
        # Clean up connection
        await ws_manager.disconnect(websocket, symbol)
