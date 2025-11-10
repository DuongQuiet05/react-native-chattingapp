import { useMemo } from 'react';
import { useConversations } from './use-conversations';
/**
 * Hook để tính tổng số tin nhắn chưa đọc từ tất cả conversations
 */
export function useUnreadMessagesCount() {
  const { data: conversations, isLoading } = useConversations();
  const unreadCount = useMemo(() => {
    if (!conversations) return 0;
    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCount || 0);
    }, 0);
  }, [conversations]);
  return {
    data: { count: unreadCount },
    isLoading,
  };
}