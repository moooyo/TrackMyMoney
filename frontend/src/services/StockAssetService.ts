import { BaseService } from './BaseService';
import type {
  ModelsStockAsset,
  HandlersCreateStockAssetRequest,
  HandlersUpdateStockAssetRequest,
} from '@/types/generated/data-contracts';
import type { HandlersRefreshPricesResponse } from '@/types/generated/Api';

export class StockAssetService extends BaseService {
  async getAll(): Promise<ModelsStockAsset[]> {
    return this.get<ModelsStockAsset[]>('/assets/stock');
  }

  async getById(id: number): Promise<ModelsStockAsset> {
    return this.get<ModelsStockAsset>(`/assets/stock/${id}`);
  }

  async create(data: HandlersCreateStockAssetRequest): Promise<ModelsStockAsset> {
    return this.post<ModelsStockAsset>('/assets/stock', data);
  }

  async update(id: number, data: HandlersUpdateStockAssetRequest): Promise<ModelsStockAsset> {
    return this.put<ModelsStockAsset>(`/assets/stock/${id}`, data);
  }

  async deleteById(id: number): Promise<void> {
    return super.delete<void>(`/assets/stock/${id}`);
  }

  /**
   * Refresh prices for all stock assets from market data
   */
  async refreshPrices(): Promise<HandlersRefreshPricesResponse> {
    return this.post<HandlersRefreshPricesResponse>('/assets/stock/refresh-prices', {});
  }
}

export default new StockAssetService();
