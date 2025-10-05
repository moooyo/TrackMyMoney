import { create } from 'zustand';
import InterestBearingAssetService from '@/services/InterestBearingAssetService';
import type {
  ModelsInterestBearingAsset,
  HandlersCreateInterestBearingAssetRequest,
  HandlersUpdateInterestBearingAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface InterestBearingAssetState {
  assets: ModelsInterestBearingAsset[];
  currentAsset: ModelsInterestBearingAsset | null;
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: HandlersCreateInterestBearingAssetRequest) => Promise<void>;
  updateAsset: (id: number, data: HandlersUpdateInterestBearingAssetRequest) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useInterestBearingAssetStore = create<InterestBearingAssetState>((set) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await InterestBearingAssetService.getAll();
      set({ assets, loading: false });
    } catch (error) {
      logger.error('Failed to fetch interest-bearing assets', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAsset = await InterestBearingAssetService.getById(id);
      set({ currentAsset, loading: false });
    } catch (error) {
      logger.error('Failed to fetch interest-bearing asset', error);
      set({ error: String(error), loading: false });
    }
  },

  createAsset: async (data: HandlersCreateInterestBearingAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await InterestBearingAssetService.create(data);
      logger.info('Interest-bearing asset created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create interest-bearing asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAsset: async (id: number, data: HandlersUpdateInterestBearingAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await InterestBearingAssetService.update(id, data);
      logger.info('Interest-bearing asset updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update interest-bearing asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await InterestBearingAssetService.deleteById(id);
      logger.info('Interest-bearing asset deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete interest-bearing asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
