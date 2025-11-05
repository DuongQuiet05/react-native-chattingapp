import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/notifications';

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => getNotifications(page, size),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: () => getUnreadNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

