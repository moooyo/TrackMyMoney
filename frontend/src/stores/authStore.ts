import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '@/services/AuthService';
import type { User } from '@/mocks/handlers/auth';
import logger from '@/utils/logger';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await AuthService.login(username, password);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
          logger.info('User logged in successfully');
        } catch (error) {
          logger.error('Login failed', error);
          throw error;
        }
      },

      logout: () => {
        AuthService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        logger.info('User logged out');
      },

      checkAuth: async () => {
        try {
          if (!AuthService.isAuthenticated()) {
            return false;
          }
          const user = await AuthService.verify();
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          logger.error('Auth check failed', error);
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
