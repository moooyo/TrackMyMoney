import { create } from 'zustand';
import NotificationService from '@/services/NotificationService';
import type { Notification } from '@/mocks/handlers/notifications';
import logger from '@/utils/logger';

interface NotificationState {
  notifications: Notification[];
  currentNotification: Notification | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchNotification: (id: number) => Promise<void>;
  createNotification: (
    data: Omit<Notification, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<void>;
  updateNotification: (id: number, data: Partial<Notification>) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  currentNotification: null,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await NotificationService.getNotifications();
      set({ notifications, loading: false });
    } catch (error) {
      logger.error('Failed to fetch notifications', error);
      set({ error: String(error), loading: false });
    }
  },

  fetchNotification: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const currentNotification = await NotificationService.getNotification(id);
      set({ currentNotification, loading: false });
    } catch (error) {
      logger.error('Failed to fetch notification', error);
      set({ error: String(error), loading: false });
    }
  },

  createNotification: async (data: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    try {
      await NotificationService.createNotification(data);
      logger.info('Notification created successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to create notification', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateNotification: async (id: number, data: Partial<Notification>) => {
    set({ loading: true, error: null });
    try {
      await NotificationService.updateNotification(id, data);
      logger.info('Notification updated successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to update notification', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteNotification: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await NotificationService.deleteNotification(id);
      logger.info('Notification deleted successfully');
      set({ loading: false });
    } catch (error) {
      logger.error('Failed to delete notification', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
