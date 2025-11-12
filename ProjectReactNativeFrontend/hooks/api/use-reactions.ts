import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessageReactions, reactToMessage, removeMessageReaction, type ReactToMessageRequest } from '@/lib/api/reactions';
import { queryKeys } from '@/lib/api/query-keys';

export function useMessageReactions(messageId: number) {
  return useQuery({
    queryKey: queryKeys.reactions.message(messageId),
    queryFn: () => getMessageReactions(messageId),
    enabled: !!messageId,
    staleTime: 0,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useReactToMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, reaction }: { messageId: number; reaction: ReactToMessageRequest }) =>
      reactToMessage(messageId, reaction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reactions.message(variables.messageId),
        refetchType: 'active',
      });
      queryClient.refetchQueries({ 
        queryKey: queryKeys.reactions.message(variables.messageId),
        type: 'active',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

export function useRemoveMessageReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => removeMessageReaction(messageId),
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reactions.message(messageId),
        refetchType: 'active',
      });
      queryClient.refetchQueries({ 
        queryKey: queryKeys.reactions.message(messageId),
        type: 'active',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}