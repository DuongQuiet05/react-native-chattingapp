import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { fetchConversations } from '@/lib/api/conversations';

export const conversationQueryKeys = {
  all: ['conversations'] as const,
  detail: (conversationId: number) => ['conversations', conversationId] as const,
};

export function useConversations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: conversationQueryKeys.all,
    queryFn: () => fetchConversations(user?.id),
    staleTime: 30_000,
  });
}
