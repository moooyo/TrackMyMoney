import { create } from 'zustand';
import CryptoAssetService from '@/services/CryptoAssetService';
import type {
  ModelsCryptoAsset,
  HandlersCreateCryptoAssetRequest,
  HandlersUpdateCryptoAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

interface CryptoAssetState {
  assets: ModelsCryptoAsset[];
  currentAsset: ModelsCryptoAsset | null;
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: HandlersCreateCryptoAssetRequest) => Promise<void>;
  updateAsset: (id: number, data: HandlersUpdateCryptoAssetRequest) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useCryptoAssetStore = create<CryptoAssetState>((set) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await CryptoAssetService.getAll();
      set({ assets, loading: false });
    } catch (error) {
      logger.error('Failed to fetch crypto assets', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAsset = await CryptoAssetService.getById(id);
      set({ currentAsset, loading: false });
    } catch (error) {
      logger.error('Failed to fetch crypto asset', error);
      set({ error: String(error), loading: false });
    }
  },

  createAsset: async (data: HandlersCreateCryptoAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await CryptoAssetService.create(data);
      logger.info('Crypto asset created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create crypto asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAsset: async (id: number, data: HandlersUpdateCryptoAssetRequest) => {
    set({ loading: true, error: null });
    try {
      await CryptoAssetService.update(id, data);
      logger.info('Crypto asset updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update crypto asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAsset: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await CryptoAssetService.deleteById(id);
      logger.info('Crypto asset deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete crypto asset', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
