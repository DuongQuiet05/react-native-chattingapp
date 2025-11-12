import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { fetchConversationDetail } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/api/query-keys';

export function useConversationDetail(conversationId: number, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    enabled,
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: () => fetchConversationDetail(conversationId, user?.id),
    staleTime: 15_000,
  });
}