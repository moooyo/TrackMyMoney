import { BaseService } from './BaseService';
import type {
  ModelsCryptoAsset,
  HandlersCreateCryptoAssetRequest,
  HandlersUpdateCryptoAssetRequest,
} from '@/types/generated/data-contracts';
import type { HandlersRefreshPricesResponse } from '@/types/generated/Api';

export class CryptoAssetService extends BaseService {
  async getAll(): Promise<ModelsCryptoAsset[]> {
    return this.get<ModelsCryptoAsset[]>('/assets/crypto');
  }

  async getById(id: number): Promise<ModelsCryptoAsset> {
    return this.get<ModelsCryptoAsset>(`/assets/crypto/${id}`);
  }

  async create(data: HandlersCreateCryptoAssetRequest): Promise<ModelsCryptoAsset> {
    return this.post<ModelsCryptoAsset>('/assets/crypto', data);
  }

  async update(id: number, data: HandlersUpdateCryptoAssetRequest): Promise<ModelsCryptoAsset> {
    return this.put<ModelsCryptoAsset>(`/assets/crypto/${id}`, data);
  }

  async deleteById(id: number): Promise<void> {
    return super.delete<void>(`/assets/crypto/${id}`);
  }

  /**
   * Refresh prices for all crypto assets from market data
   */
  async refreshPrices(): Promise<HandlersRefreshPricesResponse> {
    return this.post<HandlersRefreshPricesResponse>('/assets/crypto/refresh-prices', {});
  }
}

export default new CryptoAssetService();
