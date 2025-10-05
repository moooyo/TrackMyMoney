import { BaseService } from './BaseService';
import type {
  ModelsWatchlist,
  HandlersCreateWatchlistRequest,
  HandlersUpdateWatchlistRequest,
} from '@/types/generated/data-contracts';

export interface WatchlistWithQuote extends ModelsWatchlist {
  quote?: {
    symbol?: string;
    price?: number;
    change?: number;
    changePercent?: number;
    volume?: number;
    marketCap?: number;
    high?: number;
    low?: number;
    open?: number;
    previousClose?: number;
  };
}

class WatchlistService extends BaseService {
  /**
   * Get all watchlist items for current user
   */
  async getAll(): Promise<ModelsWatchlist[]> {
    return this.get<ModelsWatchlist[]>('/watchlist');
  }

  /**
   * Get watchlist items with real-time quotes
   */
  async getAllWithQuotes(): Promise<WatchlistWithQuote[]> {
    return this.get<WatchlistWithQuote[]>('/watchlist/quotes');
  }

  /**
   * Get watchlist item by ID
   * @param id - Watchlist item ID
   */
  async getById(id: number): Promise<ModelsWatchlist> {
    return this.get<ModelsWatchlist>(`/watchlist/${id}`);
  }

  /**
   * Create a new watchlist item
   * @param data - Watchlist item data
   */
  async create(data: HandlersCreateWatchlistRequest): Promise<ModelsWatchlist> {
    return this.post<ModelsWatchlist, HandlersCreateWatchlistRequest>('/watchlist', data);
  }

  /**
   * Update watchlist item
   * @param id - Watchlist item ID
   * @param data - Update data
   */
  async update(
    id: number,
    data: HandlersUpdateWatchlistRequest,
  ): Promise<{ message: string }> {
    return this.put<{ message: string }, HandlersUpdateWatchlistRequest>(
      `/watchlist/${id}`,
      data,
    );
  }

  /**
   * Delete watchlist item
   * @param id - Watchlist item ID
   */
  async deleteById(id: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/watchlist/${id}`);
  }
}

export default new WatchlistService();
