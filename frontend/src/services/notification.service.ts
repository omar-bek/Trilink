import api from './api';
import { ApiResponse } from '@/types';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  _id: string;
  userId: string;
  companyId: string;
  title: string;
  message?: string;
  type: NotificationType;
  read: boolean;
  readAt?: Date;
  entityType?: 'rfq' | 'bid' | 'contract' | 'dispute' | 'payment' | 'shipment';
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  /**
   * Get notifications for the current user
   */
  getNotifications: async (options?: {
    read?: boolean;
    limit?: number;
    skip?: number;
    sortBy?: 'createdAt' | 'read';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<NotificationsResponse>> => {
    const params = new URLSearchParams();
    if (options?.read !== undefined) {
      params.append('read', options.read.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.skip) {
      params.append('skip', options.skip.toString());
    }
    if (options?.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options?.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }

    const queryString = params.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<ApiResponse<NotificationsResponse>>(url);
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    const response = await api.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    const response = await api.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    const response = await api.patch<ApiResponse<UnreadCountResponse>>('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Delete all notifications
   */
  deleteAllNotifications: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    const response = await api.delete<ApiResponse<UnreadCountResponse>>('/notifications');
    return response.data;
  },
};
