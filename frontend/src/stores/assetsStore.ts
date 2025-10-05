import { create } from 'zustand';
import AssetsService from '@/services/AssetsService';
import type {
  HandlersAssetsSummary,
  HandlersAssetHistory,
  HandlersAssetStatisticsItem,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface AssetsState {
  summary: HandlersAssetsSummary | null;
  history: HandlersAssetHistory[];
  statistics: HandlersAssetStatisticsItem[];
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  fetchHistory: (period?: string) => Promise<void>;
  fetchStatistics: (dimension?: string, period?: string) => Promise<void>;
}

export const useAssetsStore = create<AssetsState>((set) => ({
  summary: null,
  history: [],
  statistics: [],
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await AssetsService.getSummary();
      set({ summary, loading: false });
    } catch (error) {
      logger.error('Failed to fetch assets summary', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchHistory: async (period = '30d') => {
    set({ loading: true, error: null });
    try {
      const history = await AssetsService.getHistory(period);
      set({ history, loading: false });
    } catch (error) {
      logger.error('Failed to fetch assets history', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchStatistics: async (dimension = 'daily', period = '30d') => {
    set({ loading: true, error: null });
    try {
      const statistics = await AssetsService.getStatistics(dimension, period);
      set({ statistics, loading: false });
    } catch (error) {
      logger.error('Failed to fetch assets statistics', error);
      set({ error: String(error), loading: false });
    }
  },
}));
