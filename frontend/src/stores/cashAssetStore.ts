import { create } from 'zustand';
import CashAssetService from '@/services/CashAssetService';
import type {
  ModelsCashAsset,
  HandlersCreateCashAssetRequest,
  HandlersUpdateCashAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface CashAssetState {
  assets: ModelsCashAsset[];
  currentAsset: ModelsCashAsset | null;
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: HandlersCreateCashAssetRequest) => Promise<void>;
  updateAsset: (id: number, data: HandlersUpdateCashAssetRequest) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useCashAssetStore = create<CashAssetState>((set) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await CashAssetService.getAll();
      set({ assets, loading: false });
    } catch (error) {
      logger.error('Failed to fetch cash assets', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAsset = await CashAssetService.getById(id);
      set({ currentAsset, loading: false });
    } catch (error) {
      logger.error('Failed to fetch cash asset', error);
      set({ error: String(error), loading: false });
    }
  },

  createAsset: async (data: HandlersCreateCashAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await CashAssetService.create(data);
      logger.info('Cash asset created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create cash asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAsset: async (id: number, data: HandlersUpdateCashAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await CashAssetService.update(id, data);
      logger.info('Cash asset updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update cash asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await CashAssetService.deleteById(id);
      logger.info('Cash asset deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete cash asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
