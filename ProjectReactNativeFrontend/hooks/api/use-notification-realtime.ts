import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStomp } from '@/providers/stomp-provider';
import { useAuth } from '@/contexts/auth-context';
import type { NotificationDto } from '@/lib/api/notifications';

/**
 * Hook để subscribe vào notifications realtime và tự động cập nhật query cache
 */
export function useNotificationRealtime() {
  const { subscribe, connected } = useStomp();
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Chỉ subscribe khi đã authenticated và connected
    if (status !== 'authenticated' || !connected) {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      return;
    }

    console.log('📡 [Notifications] Subscribing to /user/queue/notifications');

    // Subscribe vào user queue - Spring sẽ tự động route đến đúng user session
    const unsubscribe = subscribe('/user/queue/notifications', (message) => {
      try {
        const notification: NotificationDto = JSON.parse(message.body);
        console.log('📬 [Notifications] Received notification:', notification);

        // Cập nhật unread count cho notification (chuông) - chỉ POST_COMMENT, POST_REACTION, COMMENT_REPLY
        if (['POST_COMMENT', 'POST_REACTION', 'COMMENT_REPLY'].includes(notification.notificationType)) {
          queryClient.setQueryData<{ count: number }>(['unreadCount'], (oldData) => {
            if (!oldData) return { count: 1 };
            return { count: oldData.count + 1 };
          });
        }
        
        // Cập nhật unread count cho tin nhắn - chỉ MESSAGE, MESSAGE_REACTION
        if (['MESSAGE', 'MESSAGE_REACTION'].includes(notification.notificationType)) {
          queryClient.setQueryData<{ count: number }>(['unreadMessageNotificationCount'], (oldData) => {
            if (!oldData) return { count: 1 };
            return { count: oldData.count + 1 };
          });
        }

        // Cập nhật notifications list - thêm notification mới vào đầu danh sách
        queryClient.setQueriesData<{ content: NotificationDto[] }>(
          { queryKey: ['notifications'] },
          (oldData) => {
            if (!oldData) return oldData;
            
            // Kiểm tra xem notification đã tồn tại chưa (tránh duplicate)
            const exists = oldData.content.some((n) => n.id === notification.id);
            if (exists) return oldData;
            
            return {
              ...oldData,
              content: [notification, ...oldData.content],
              totalElements: oldData.totalElements + 1,
            };
          },
        );

        // Cập nhật unread notifications list
        queryClient.setQueriesData<{ notifications: NotificationDto[] }>(
          { queryKey: ['unreadNotifications'] },
          (oldData) => {
            if (!oldData) return oldData;
            
            const exists = oldData.notifications.some((n) => n.id === notification.id);
            if (exists) return oldData;
            
            return {
              notifications: [notification, ...oldData.notifications],
            };
          },
        );
      } catch (error) {
        console.error('❌ [Notifications] Error processing notification:', error);
      }
    });

    subscriptionRef.current = unsubscribe;

    return () => {
      console.log('🔕 [Notifications] Unsubscribing from /user/queue/notifications');
      unsubscribe();
      subscriptionRef.current = null;
    };
  }, [subscribe, connected, status, queryClient]);
}

