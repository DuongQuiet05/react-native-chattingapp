import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { fetchConversations, createConversation, type CreateConversationRequest, type CreateConversationResponse } from '@/lib/api/conversations';

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

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => createConversation(payload),
    onSuccess: () => {
      // Invalidate conversations list để refresh danh sách
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
  });
}
