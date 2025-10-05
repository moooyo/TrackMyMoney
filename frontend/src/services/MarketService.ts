import { BaseService } from './BaseService';
import type {
  ModelsQuote,
  ModelsQuotesRequest,
  ModelsQuotesResponse,
  ModelsHistoryResponse,
  ModelsInfoResponse,
  ModelsSearchResponse,
} from '@/types/generated/Api';

class MarketService extends BaseService {
  /**
   * Get real-time quote for a single stock or crypto symbol
   * @param symbol - Stock or crypto symbol (e.g., AAPL, BTC-USD)
   */
  async getQuote(symbol: string): Promise<ModelsQuote> {
    return this.get<ModelsQuote>(`/market/quote/${symbol}`);
  }

  /**
   * Get quotes for multiple symbols at once
   * @param symbols - Array of stock or crypto symbols
   */
  async getQuotes(symbols: string[]): Promise<ModelsQuotesResponse> {
    const request: ModelsQuotesRequest = { symbols };
    return this.post<ModelsQuotesResponse, ModelsQuotesRequest>('/market/quotes', request);
  }

  /**
   * Get historical price data for a stock or crypto
   * @param symbol - Stock or crypto symbol
   * @param period - Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
   * @param interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
   */
  async getHistory(
    symbol: string,
    period = '1mo',
    interval = '1d'
  ): Promise<ModelsHistoryResponse> {
    return this.get<ModelsHistoryResponse>(
      `/market/history/${symbol}?period=${period}&interval=${interval}`
    );
  }

  /**
   * Get basic information about a stock or cryptocurrency
   * @param symbol - Stock or crypto symbol
   */
  async getInfo(symbol: string): Promise<ModelsInfoResponse> {
    return this.get<ModelsInfoResponse>(`/market/info/${symbol}`);
  }

  /**
   * Search for stocks or cryptocurrencies by name or symbol
   * @param query - Search query
   * @param limit - Maximum number of results (default: 10, max: 50)
   */
  async search(query: string, limit = 10): Promise<ModelsSearchResponse> {
    return this.get<ModelsSearchResponse>(
      `/market/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }
}

export const marketService = new MarketService();
