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
export function useNotifications(page = 0, size = 20) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => getNotifications(page, size),
    enabled: status === 'authenticated', // Only fetch when authenticated
    refetchInterval: status === 'authenticated' ? 30000 : false, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
export function useUnreadNotifications() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: () => getUnreadNotifications(),
    enabled: status === 'authenticated', // Only fetch when authenticated
    refetchInterval: status === 'authenticated' ? 30000 : false, // Refetch every 30 seconds
  });
}
export function useUnreadCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => getUnreadCount(),
    enabled: status === 'authenticated', // Only fetch when authenticated
    refetchInterval: status === 'authenticated' ? 30000 : false, // Refetch every 30 seconds
  });
}
export function useUnreadMessageNotificationCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['unreadMessageNotificationCount'],
    queryFn: () => getUnreadMessageNotificationCount(),
    enabled: status === 'authenticated', // Only fetch when authenticated
    refetchInterval: status === 'authenticated' ? 30000 : false, // Refetch every 30 seconds
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