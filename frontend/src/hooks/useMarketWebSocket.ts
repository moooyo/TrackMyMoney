/**
 * Custom hook for WebSocket connection to real-time market data
 */

import { useEffect, useCallback, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import logger from '@/utils/logger';

export interface MarketDataMessage {
  symbol: string;
  price?: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  timestamp?: number;
}

export interface ConnectionMessage {
  type: 'connection' | 'subscription_changed';
  status?: string;
  symbol?: string;
  message?: string;
}

export interface UseMarketWebSocketOptions {
  enabled?: boolean;
  onMessage?: (data: MarketDataMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UseMarketWebSocketReturn {
  lastMessage: MarketDataMessage | null;
  readyState: ReadyState;
  connected: boolean;
  subscribe: (symbol: string) => void;
  sendPing: () => void;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

/**
 * Hook for connecting to market data WebSocket
 *
 * @param symbol - Stock or crypto symbol to subscribe to (e.g., 'AAPL', 'BTC-USD')
 * @param options - Configuration options
 * @returns WebSocket connection state and controls
 *
 * @example
 * ```tsx
 * const { lastMessage, connected, subscribe } = useMarketWebSocket('AAPL', {
 *   enabled: true,
 *   onMessage: (data) => console.log('New price:', data.price),
 * });
 * ```
 */
export const useMarketWebSocket = (
  symbol: string,
  options: UseMarketWebSocketOptions = {},
): UseMarketWebSocketReturn => {
  const {
    enabled = true,
    onMessage,
    onConnectionChange,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const lastMessageRef = useRef<MarketDataMessage | null>(null);
  const currentSymbol = useRef(symbol);

  // Construct WebSocket URL
  const socketUrl = enabled ? `${WS_BASE_URL}/ws/market?symbol=${symbol.toUpperCase()}` : null;

  // WebSocket connection
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts,
    reconnectInterval,
    onOpen: () => {
      logger.info(`WebSocket connected for ${symbol}`);
      onConnectionChange?.(true);
    },
    onClose: () => {
      logger.info(`WebSocket disconnected for ${symbol}`);
      onConnectionChange?.(false);
    },
    onError: (event) => {
      logger.error(`WebSocket error for ${symbol}:`, event);
    },
  });

  // Handle incoming messages
  useEffect(() => {
    if (!lastJsonMessage) return;

    try {
      const message = lastJsonMessage as MarketDataMessage | ConnectionMessage;

      // Handle connection/subscription messages
      if ('type' in message) {
        if (message.type === 'connection' || message.type === 'subscription_changed') {
          logger.info(`WebSocket: ${message.message}`);
          return;
        }
      }

      // Handle market data messages
      if ('symbol' in message && message.symbol) {
        const marketData = message as MarketDataMessage;
        lastMessageRef.current = marketData;

        logger.debug(`Market data received for ${marketData.symbol}:`, marketData);

        // Call onMessage callback
        onMessage?.(marketData);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
    }
  }, [lastJsonMessage, onMessage]);

  // Subscribe to a different symbol
  const subscribe = useCallback(
    (newSymbol: string) => {
      if (newSymbol === currentSymbol.current) return;

      currentSymbol.current = newSymbol;
      sendJsonMessage({
        type: 'subscribe',
        symbol: newSymbol.toUpperCase(),
      });

      logger.info(`Switching subscription to ${newSymbol}`);
    },
    [sendJsonMessage],
  );

  // Send ping to keep connection alive
  const sendPing = useCallback(() => {
    sendJsonMessage({
      type: 'ping',
      timestamp: Date.now(),
    });
  }, [sendJsonMessage]);

  // Periodic ping to keep connection alive
  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;

    const interval = setInterval(() => {
      sendPing();
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, [readyState, sendPing]);

  const connected = readyState === ReadyState.OPEN;

  return {
    lastMessage: lastMessageRef.current,
    readyState,
    connected,
    subscribe,
    sendPing,
  };
};
