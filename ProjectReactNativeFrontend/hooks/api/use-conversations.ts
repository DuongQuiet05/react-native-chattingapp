import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { fetchConversations, fetchConversationDetail, createConversation, type CreateConversationRequest } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/api/query-keys';

export function useConversations() {
  const { user, status } = useAuth();
  return useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: () => fetchConversations(user?.id),
    enabled: status === 'authenticated' && !!user,
    staleTime: 30_000,
  });
}

export function useConversationDetail(conversationId: number, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: () => fetchConversationDetail(conversationId, user?.id),
    enabled: enabled && !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => createConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

// Export conversationQueryKeys for backward compatibility
export const conversationQueryKeys = {
  all: queryKeys.conversations.all,
  detail: (conversationId: number) => queryKeys.conversations.detail(conversationId),
};