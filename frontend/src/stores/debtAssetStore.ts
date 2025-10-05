import { create } from 'zustand';
import DebtAssetService from '@/services/DebtAssetService';
import type {
  ModelsDebtAsset,
  HandlersCreateDebtAssetRequest,
  HandlersUpdateDebtAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface DebtAssetState {
  assets: ModelsDebtAsset[];
  currentAsset: ModelsDebtAsset | null;
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: HandlersCreateDebtAssetRequest) => Promise<void>;
  updateAsset: (id: number, data: HandlersUpdateDebtAssetRequest) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useDebtAssetStore = create<DebtAssetState>((set) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await DebtAssetService.getAll();
      set({ assets, loading: false });
    } catch (error) {
      logger.error('Failed to fetch debt assets', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAsset = await DebtAssetService.getById(id);
      set({ currentAsset, loading: false });
    } catch (error) {
      logger.error('Failed to fetch debt asset', error);
      set({ error: String(error), loading: false });
    }
  },

  createAsset: async (data: HandlersCreateDebtAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await DebtAssetService.create(data);
      logger.info('Debt asset created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create debt asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAsset: async (id: number, data: HandlersUpdateDebtAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await DebtAssetService.update(id, data);
      logger.info('Debt asset updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update debt asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await DebtAssetService.deleteById(id);
      logger.info('Debt asset deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete debt asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
