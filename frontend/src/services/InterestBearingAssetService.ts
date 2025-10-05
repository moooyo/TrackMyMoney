import { BaseService } from './BaseService';
import type {
  ModelsInterestBearingAsset,
  HandlersCreateInterestBearingAssetRequest,
  HandlersUpdateInterestBearingAssetRequest,
} from '@/types/generated/data-contracts';

export class InterestBearingAssetService extends BaseService {
  async getAll(): Promise<ModelsInterestBearingAsset[]> {
    return this.get<ModelsInterestBearingAsset[]>('/assets/interest-bearing');
  }

  async getById(id: number): Promise<ModelsInterestBearingAsset> {
    return this.get<ModelsInterestBearingAsset>(`/assets/interest-bearing/${id}`);
  }

  async create(
    data: HandlersCreateInterestBearingAssetRequest,
  ): Promise<ModelsInterestBearingAsset> {
    return this.post<ModelsInterestBearingAsset>('/assets/interest-bearing', data);
  }

  async update(
    id: number,
    data: HandlersUpdateInterestBearingAssetRequest,
  ): Promise<ModelsInterestBearingAsset> {
    return this.put<ModelsInterestBearingAsset>(`/assets/interest-bearing/${id}`, data);
  }

  async deleteById(id: number): Promise<void> {
    return super.delete<void>(`/assets/interest-bearing/${id}`);
  }
}

export default new InterestBearingAssetService();
