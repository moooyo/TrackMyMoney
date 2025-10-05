import { BaseService } from './BaseService';
import type { HandlersAssetsSummary, HandlersAssetHistory } from '@/types/generated/data-contracts';

export class AssetsService extends BaseService {
  async getSummary(): Promise<HandlersAssetsSummary> {
    return this.get<HandlersAssetsSummary>('/assets/summary');
  }

  async getHistory(period: string = '30d'): Promise<HandlersAssetHistory[]> {
    return this.get<HandlersAssetHistory[]>(`/assets/history?period=${period}`);
  }
}

export default new AssetsService();
