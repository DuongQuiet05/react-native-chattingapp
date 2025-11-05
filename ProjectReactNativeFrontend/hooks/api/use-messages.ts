import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    fetchMessages,
    sendMessage,
    type MessageDto,
    type SendMessageRequest,
    type SendMessageResponse,
} from '@/lib/api/messages';
import { conversationQueryKeys } from './use-conversations';

export const messageQueryKeys = {
  list: (conversationId: number) => [...conversationQueryKeys.detail(conversationId), 'messages'] as const,
};

export function useMessages(conversationId: number, enabled: boolean, refetchInterval?: number) {
  return useQuery({
    enabled,
    queryKey: messageQueryKeys.list(conversationId),
    queryFn: () => fetchMessages(conversationId),
    refetchInterval: refetchInterval ?? false,
    staleTime: 10_000,
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<SendMessageRequest, 'conversationId'>) =>
      sendMessage({ ...payload, conversationId }),
    onSuccess: (response: SendMessageResponse) => {
      const newMessage = response.message;

      queryClient.setQueryData<MessageDto[] | undefined>(
        messageQueryKeys.list(conversationId),
        (previousMessages: MessageDto[] | undefined) => {
          if (!previousMessages) {
            return [newMessage];
          }

          const alreadyExists = previousMessages.some(
            (message: MessageDto) => message.id === newMessage.id,
          );
          if (alreadyExists) {
            return previousMessages.map((message: MessageDto) =>
              message.id === newMessage.id ? newMessage : message,
            );
          }

          return [...previousMessages, newMessage];
        },
      );

      // keep conversation list fresh
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
  });
}
