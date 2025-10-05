import { create } from 'zustand';
import StockAssetService from '@/services/StockAssetService';
import type {
  ModelsStockAsset,
  HandlersCreateStockAssetRequest,
  HandlersUpdateStockAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface StockAssetState {
  assets: ModelsStockAsset[];
  currentAsset: ModelsStockAsset | null;
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: HandlersCreateStockAssetRequest) => Promise<void>;
  updateAsset: (id: number, data: HandlersUpdateStockAssetRequest) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useStockAssetStore = create<StockAssetState>((set) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await StockAssetService.getAll();
      set({ assets, loading: false });
    } catch (error) {
      logger.error('Failed to fetch stock assets', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAsset = await StockAssetService.getById(id);
      set({ currentAsset, loading: false });
    } catch (error) {
      logger.error('Failed to fetch stock asset', error);
      set({ error: String(error), loading: false });
    }
  },

  createAsset: async (data: HandlersCreateStockAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await StockAssetService.create(data);
      logger.info('Stock asset created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create stock asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAsset: async (id: number, data: HandlersUpdateStockAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await StockAssetService.update(id, data);
      logger.info('Stock asset updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update stock asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await StockAssetService.deleteById(id);
      logger.info('Stock asset deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete stock asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
