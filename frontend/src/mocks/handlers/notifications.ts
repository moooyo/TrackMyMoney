import { http, HttpResponse } from 'msw';

export interface Notification {
  id: number;
  name: string;
  channel: 'bark' | 'telegram_bot' | 'email';
  description: string;
  config: string;
  schedule: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    name: 'Bark 推送',
    channel: 'bark',
    description: '每日资产汇总推送',
    config: JSON.stringify({ device_key: 'your_bark_key' }),
    schedule: '0 9 * * *',
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

let nextId = 2;

export const notificationHandlers = [
  http.post('/api/notifications', async ({ request }) => {
    const body = (await request.json()) as Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
    const newNotification: Notification = {
      ...body,
      id: nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockNotifications.push(newNotification);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: newNotification,
    });
  }),

  http.get('/api/notifications', () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockNotifications,
    });
  }),

  http.get('/api/notifications/:id', ({ params }) => {
    const { id } = params;
    const notification = mockNotifications.find((n) => n.id === Number(id));
    if (!notification) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Notification not found',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: notification,
    });
  }),

  http.put('/api/notifications/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<Notification>;
    const notificationIndex = mockNotifications.findIndex((n) => n.id === Number(id));
    if (notificationIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Notification not found',
        },
        { status: 404 },
      );
    }
    mockNotifications[notificationIndex] = {
      ...mockNotifications[notificationIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: mockNotifications[notificationIndex],
    });
  }),

  http.delete('/api/notifications/:id', ({ params }) => {
    const { id } = params;
    const notificationIndex = mockNotifications.findIndex((n) => n.id === Number(id));
    if (notificationIndex === -1) {
      return HttpResponse.json(
        {
          code: 404,
          message: 'Notification not found',
        },
        { status: 404 },
      );
    }
    mockNotifications.splice(notificationIndex, 1);
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { message: 'Notification deleted successfully' },
    });
  }),
];
