import { BaseService } from './BaseService';
import type {
  ModelsDebtAsset,
  HandlersCreateDebtAssetRequest,
  HandlersUpdateDebtAssetRequest,
} from '@/types/generated/data-contracts';

export class DebtAssetService extends BaseService {
  async getAll(): Promise<ModelsDebtAsset[]> {
    return this.get<ModelsDebtAsset[]>('/assets/debt');
  }

  async getById(id: number): Promise<ModelsDebtAsset> {
    return this.get<ModelsDebtAsset>(`/assets/debt/${id}`);
  }

  async create(data: HandlersCreateDebtAssetRequest): Promise<ModelsDebtAsset> {
    return this.post<ModelsDebtAsset>('/assets/debt', data);
  }

  async update(id: number, data: HandlersUpdateDebtAssetRequest): Promise<ModelsDebtAsset> {
    return this.put<ModelsDebtAsset>(`/assets/debt/${id}`, data);
  }

  async deleteById(id: number): Promise<void> {
    return super.delete<void>(`/assets/debt/${id}`);
  }
}

export default new DebtAssetService();
