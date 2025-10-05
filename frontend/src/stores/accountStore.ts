import { create } from 'zustand';
import AccountService from '@/services/AccountService';
import type { Account } from '@/mocks/handlers/accounts';
import logger from '@/utils/logger';

interface AccountState {
  accounts: Account[];
  currentAccount: Account | null;
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  fetchAccount: (id: number) => Promise<void>;
  createAccount: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAccount: (id: number, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  currentAccount: null,
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const accounts = await AccountService.getAccounts();
      set({ accounts, loading: false });
    } catch (error) {
      logger.error('Failed to fetch accounts', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchAccount: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentAccount = await AccountService.getAccount(id);
      set({ currentAccount, loading: false });
    } catch (error) {
      logger.error('Failed to fetch account', error);
      set({ error: String(error), loading: false });
    }
  },

  createAccount: async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    try {
      await AccountService.createAccount(data);
      logger.info('Account created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create account', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateAccount: async (id: number, data: Partial<Account>) => {
    set({ loading: true, error: null });
    try {
      await AccountService.updateAccount(id, data);
      logger.info('Account updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update account', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteAccount: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await AccountService.deleteAccount(id);
      logger.info('Account deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete account', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
