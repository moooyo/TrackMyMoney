import { BaseService } from './BaseService';
import type { Notification } from '@/mocks/handlers/notifications';

export class NotificationService extends BaseService {
  async getNotifications(): Promise<Notification[]> {
    return this.get<Notification[]>('/notifications');
  }

  async getNotification(id: number): Promise<Notification> {
    return this.get<Notification>(`/notifications/${id}`);
  }

  async createNotification(
    data: Omit<Notification, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Notification> {
    return this.post<Notification>('/notifications', data);
  }

  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification> {
    return this.put<Notification>(`/notifications/${id}`, data);
  }

  async deleteNotification(id: number): Promise<void> {
    return this.delete<void>(`/notifications/${id}`);
  }
}

export default new NotificationService();
