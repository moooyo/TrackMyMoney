import { BaseService } from './BaseService';
import type {
  ModelsCashAsset,
  HandlersCreateCashAssetRequest,
  HandlersUpdateCashAssetRequest,
} from '@/types/generated/data-contracts';

export class CashAssetService extends BaseService {
  async getAll(): Promise<ModelsCashAsset[]> {
    return this.get<ModelsCashAsset[]>('/assets/cash');
  }

  async getById(id: number): Promise<ModelsCashAsset> {
    return this.get<ModelsCashAsset>(`/assets/cash/${id}`);
  }

  async create(data: HandlersCreateCashAssetRequest): Promise<ModelsCashAsset> {
    return this.post<ModelsCashAsset>('/assets/cash', data);
  }

  async update(id: number, data: HandlersUpdateCashAssetRequest): Promise<ModelsCashAsset> {
    return this.put<ModelsCashAsset>(`/assets/cash/${id}`, data);
  }

  async deleteById(id: number): Promise<void> {
    return super.delete<void>(`/assets/cash/${id}`);
  }
}

export default new CashAssetService();
