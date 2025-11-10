import { apiFetch } from './http-client';
export interface MessageReactionDto {
  id: number;
  messageId: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
  createdAt: string;
}
export interface ReactToMessageRequest {
  reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
}
export async function reactToMessage(messageId: number, reaction: ReactToMessageRequest) {
  return apiFetch<{ success: boolean; message?: string; reaction?: MessageReactionDto }>(
    `/messages/${messageId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify(reaction),
    }
  );
}
export async function removeMessageReaction(messageId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/messages/${messageId}/reactions`, {
    method: 'DELETE',
  });
}
export async function getMessageReactions(messageId: number) {
  return apiFetch<MessageReactionDto[]>(`/messages/${messageId}/reactions`);
}