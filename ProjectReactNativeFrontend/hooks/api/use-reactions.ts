import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessageReactions, reactToMessage, removeMessageReaction, type ReactToMessageRequest, type MessageReactionDto } from '@/lib/api/reactions';
export function useMessageReactions(messageId: number) {
  return useQuery({
    queryKey: ['messageReactions', messageId],
    queryFn: () => getMessageReactions(messageId),
    enabled: !!messageId,
    staleTime: 0, // Always consider data stale to ensure real-time updates
    refetchInterval: false, // Don't auto-refetch, rely on WebSocket/notifications
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount to get latest data
  });
}
export function useReactToMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, reaction }: { messageId: number; reaction: ReactToMessageRequest }) =>
      reactToMessage(messageId, reaction),
    onSuccess: (data, variables) => {
      // Luôn refetch reactions ngay lập tức để đảm bảo có data mới nhất từ server
      // (bao gồm cả reactions từ users khác trong conversation)
      queryClient.invalidateQueries({ 
        queryKey: ['messageReactions', variables.messageId],
        refetchType: 'active',
      });
      // Force refetch ngay lập tức (không cần setTimeout)
      queryClient.refetchQueries({ 
        queryKey: ['messageReactions', variables.messageId],
        type: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
export function useRemoveMessageReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => removeMessageReaction(messageId),
    onSuccess: (_, messageId) => {
      // Invalidate và refetch reactions ngay lập tức
      queryClient.invalidateQueries({ 
        queryKey: ['messageReactions', messageId],
        refetchType: 'active',
      });
      // Force refetch ngay lập tức
      queryClient.refetchQueries({ 
        queryKey: ['messageReactions', messageId],
        type: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}