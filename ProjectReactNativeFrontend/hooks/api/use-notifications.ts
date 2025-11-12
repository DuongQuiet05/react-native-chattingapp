import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  getUnreadMessageNotificationCount,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/notifications';
import { useAuth } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/api/query-keys';

export function useNotifications(page = 0, size = 20) {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications.list(page, size),
    queryFn: () => getNotifications(page, size),
    enabled: status === 'authenticated',
    refetchInterval: status === 'authenticated' ? 30000 : false,
    staleTime: 10000,
  });
}

export function useUnreadNotifications() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => getUnreadNotifications(),
    enabled: status === 'authenticated',
    refetchInterval: status === 'authenticated' ? 30000 : false,
  });
}

export function useUnreadCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => getUnreadCount(),
    enabled: status === 'authenticated',
    refetchInterval: status === 'authenticated' ? 30000 : false,
  });
}

export function useUnreadMessageNotificationCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications.unreadMessageCount,
    queryFn: () => getUnreadMessageNotificationCount(),
    enabled: status === 'authenticated',
    refetchInterval: status === 'authenticated' ? 30000 : false,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}