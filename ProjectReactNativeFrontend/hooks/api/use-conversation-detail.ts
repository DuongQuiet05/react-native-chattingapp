import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { fetchConversationDetail } from '@/lib/api/conversations';
import { conversationQueryKeys } from './use-conversations';

export function useConversationDetail(conversationId: number, enabled: boolean) {
  const { user } = useAuth();
  
  return useQuery({
    enabled,
    queryKey: conversationQueryKeys.detail(conversationId),
    queryFn: () => fetchConversationDetail(conversationId, user?.id),
    staleTime: 15_000,
  });
}
