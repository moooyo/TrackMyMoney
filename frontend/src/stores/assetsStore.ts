import { create } from 'zustand';
import AssetsService from '@/services/AssetsService';
import type { HandlersAssetsSummary, HandlersAssetHistory } from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface AssetsState {
  summary: HandlersAssetsSummary | null;
  history: HandlersAssetHistory[];
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  fetchHistory: (period?: string) => Promise<void>;
}

export const useAssetsStore = create<AssetsState>((set) => ({
  summary: null,
  history: [],
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
}));
