import { BaseService } from './BaseService';
import type { Account } from '@/mocks/handlers/accounts';

export class AccountService extends BaseService {
  async getAccounts(): Promise<Account[]> {
    return this.get<Account[]>('/accounts');
  }

  async getAccount(id: number): Promise<Account> {
    return this.get<Account>(`/accounts/${id}`);
  }

  async createAccount(data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    return this.post<Account>('/accounts', data);
  }

  async updateAccount(id: number, data: Partial<Account>): Promise<Account> {
    return this.put<Account>(`/accounts/${id}`, data);
  }

  async deleteAccount(id: number): Promise<void> {
    return this.delete<void>(`/accounts/${id}`);
  }
}

export default new AccountService();
