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
    if (status !== 'authenticated' || !connected) {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      return;
    }// Subscribe vào user queue - Spring sẽ tự động route đến đúng user session
    const unsubscribe = subscribe('/user/queue/notifications', (message) => {
      try {
        const notification: NotificationDto = JSON.parse(message.body);// Cập nhật unread count cho notification (chuông) - chỉ POST_COMMENT, POST_REACTION, COMMENT_REPLY
        if (['POST_COMMENT', 'POST_REACTION', 'COMMENT_REPLY'].includes(notification.notificationType)) {
          queryClient.setQueryData<{ count: number }>(['unreadCount'], (oldData) => {
            if (!oldData) return { count: 1 };
            return { count: oldData.count + 1 };
          });
        }
        if (['MESSAGE', 'MESSAGE_REACTION'].includes(notification.notificationType)) {
          queryClient.setQueryData<{ count: number }>(['unreadMessageNotificationCount'], (oldData) => {
            if (!oldData) return { count: 1 };
            return { count: oldData.count + 1 };
          });
          
          // Nếu có MESSAGE_REACTION notification, invalidate reactions query để cập nhật real-time
          if (notification.notificationType === 'MESSAGE_REACTION' && notification.relatedEntityId) {
            // relatedEntityId là messageId trong trường hợp này
            const messageId = typeof notification.relatedEntityId === 'number' 
              ? notification.relatedEntityId 
              : parseInt(String(notification.relatedEntityId), 10);
            if (!isNaN(messageId)) {
              console.log('📬 [Notifications] Invalidating reactions for message:', messageId);
              // Invalidate reactions query và force refetch ngay lập tức
              queryClient.invalidateQueries({ 
                queryKey: ['messageReactions', messageId],
                refetchType: 'active', // Chỉ refetch nếu query đang active
              });
              // Force refetch ngay lập tức để đảm bảo có data mới nhất
              setTimeout(() => {
                queryClient.refetchQueries({ 
                  queryKey: ['messageReactions', messageId],
                  type: 'active',
                });
              }, 50);
            }
          }
        }
        queryClient.setQueriesData<{ content: NotificationDto[] }>(
          { queryKey: ['notifications'] },
          (oldData) => {
            if (!oldData) return oldData;
            const exists = oldData.content.some((n) => n.id === notification.id);
            if (exists) return oldData;
            return {
              ...oldData,
              content: [notification, ...oldData.content],
              totalElements: oldData.totalElements + 1,
            };
          },
        );
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
      } catch (error) {}
    });
    subscriptionRef.current = unsubscribe;
    return () => {unsubscribe();
      subscriptionRef.current = null;
    };
  }, [subscribe, connected, status, queryClient]);
}