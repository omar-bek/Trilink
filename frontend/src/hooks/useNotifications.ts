import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '@/services/notification.service';
import { queryKeys } from '@/lib/queryKeys';
import { notificationService as toastNotificationService } from '@/utils/notification';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to fetch and manage notifications
 */
export const useNotifications = (options?: {
  read?: boolean;
  limit?: number;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list(options),
    queryFn: async () => {
      const response = await notificationService.getNotifications({
        read: options?.read,
        limit: options?.limit || 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: options?.enabled !== false,
  });

  // Fetch unread count
  const unreadCountQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data.count;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: options?.enabled !== false,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      // Navigate to action URL if available
      if (data.data?.actionUrl) {
        navigate(data.data.actionUrl);
      }
    },
    onError: (error: any) => {
      toastNotificationService.showError(
        error?.response?.data?.error || 'Failed to mark notification as read'
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toastNotificationService.showSuccess('All notifications marked as read');
    },
    onError: (error: any) => {
      toastNotificationService.showError(
        error?.response?.data?.error || 'Failed to mark all notifications as read'
      );
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toastNotificationService.showSuccess('Notification deleted');
    },
    onError: (error: any) => {
      toastNotificationService.showError(
        error?.response?.data?.error || 'Failed to delete notification'
      );
    },
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toastNotificationService.showSuccess('All notifications deleted');
    },
    onError: (error: any) => {
      toastNotificationService.showError(
        error?.response?.data?.error || 'Failed to delete all notifications'
      );
    },
  });

  return {
    notifications: notificationsQuery.data?.notifications || [],
    total: notificationsQuery.data?.total || 0,
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading,
    isLoadingCount: unreadCountQuery.isLoading,
    isError: notificationsQuery.isError || unreadCountQuery.isError,
    error: notificationsQuery.error || unreadCountQuery.error,
    refetch: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    },
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isDeletingAll: deleteAllNotificationsMutation.isPending,
  };
};
