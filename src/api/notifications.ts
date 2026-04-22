import { api } from './axios';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  data?: Record<string, any>;
  link?: string;
  createdAt: string;
}

export enum NotificationType {
  MATERIAL_RECEIVED = 'MATERIAL_RECEIVED',
  MATERIAL_USED = 'MATERIAL_USED',
  MATERIAL_LOW_STOCK = 'MATERIAL_LOW_STOCK',
  SITE_CREATED = 'SITE_CREATED',
  SITE_UPDATED = 'SITE_UPDATED',
  PRICE_UPDATED = 'PRICE_UPDATED',
  RECORD_RECEIVED = 'RECORD_RECEIVED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const { data } = await api.get('/notifications', { params });
    return data as {
      notifications: Notification[];
      total: number;
      unreadCount: number;
      hasMore: boolean;
    };
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count;
  },

  // Mark as read
  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
