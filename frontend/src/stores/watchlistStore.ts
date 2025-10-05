import { create } from 'zustand';
import WatchlistService, { type WatchlistWithQuote } from '@/services/WatchlistService';
import type {
  ModelsWatchlist,
  HandlersCreateWatchlistRequest,
  HandlersUpdateWatchlistRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface WatchlistState {
  watchlist: WatchlistWithQuote[];
  currentItem: ModelsWatchlist | null;
  loading: boolean;
  error: string | null;
  fetchWatchlist: () => Promise<void>;
  fetchWatchlistWithQuotes: () => Promise<void>;
  fetchItem: (id: number) => Promise<void>;
  createItem: (data: HandlersCreateWatchlistRequest) => Promise<void>;
  updateItem: (id: number, data: HandlersUpdateWatchlistRequest) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  watchlist: [],
  currentItem: null,
  loading: false,
  error: null,

  fetchWatchlist: async () => {
    set({ loading: true, error: null });
    try {
      const watchlist = await WatchlistService.getAll();
      set({ watchlist, loading: false });
    } catch (error) {
      logger.error('Failed to fetch watchlist', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchWatchlistWithQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const watchlist = await WatchlistService.getAllWithQuotes();
      set({ watchlist, loading: false });
    } catch (error) {
      logger.error('Failed to fetch watchlist with quotes', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchItem: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentItem = await WatchlistService.getById(id);
      set({ currentItem, loading: false });
    } catch (error) {
      logger.error('Failed to fetch watchlist item', error);
      set({ error: String(error), loading: false });
    }
  },

  createItem: async (data: HandlersCreateWatchlistRequest) => {
    set({ loading: true, error: null });
    try {
      await WatchlistService.create(data);
      logger.info('Watchlist item created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create watchlist item', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateItem: async (id: number, data: HandlersUpdateWatchlistRequest) => {
    set({ loading: true, error: null });
    try {
      await WatchlistService.update(id, data);
      logger.info('Watchlist item updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update watchlist item', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteItem: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await WatchlistService.deleteById(id);
      logger.info('Watchlist item deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete watchlist item', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
