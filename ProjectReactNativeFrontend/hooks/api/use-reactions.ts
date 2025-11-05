import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessageReactions, reactToMessage, removeMessageReaction, type ReactToMessageRequest } from '@/lib/api/reactions';

export function useMessageReactions(messageId: number) {
  return useQuery({
    queryKey: ['messageReactions', messageId],
    queryFn: () => getMessageReactions(messageId),
    enabled: !!messageId,
  });
}

export function useReactToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, reaction }: { messageId: number; reaction: ReactToMessageRequest }) =>
      reactToMessage(messageId, reaction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messageReactions', variables.messageId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useRemoveMessageReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => removeMessageReaction(messageId),
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries({ queryKey: ['messageReactions', messageId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

