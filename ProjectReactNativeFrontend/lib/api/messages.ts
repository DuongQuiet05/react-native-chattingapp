import type { UserProfile } from './auth';
import { apiFetch } from './http-client';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM';
export type ReceiptStatus = 'SENT' | 'DELIVERED' | 'READ';
interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  messageType: MessageType;
  sentAt: string;
  receiptStatus?: ReceiptStatus;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  thumbnailUrl?: string | null;
}
export interface MessageDto {
  id: number;
  conversationId: number;
  sender: UserProfile;
  content: string;
  messageType: MessageType;
  sentAt: string;
  receiptStatus?: ReceiptStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
}
export interface SendMessageRequest {
  conversationId: number;
  content: string;
  messageType?: MessageType;
  clientMessageId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
}
export interface SendMessageResponse {
  message: MessageDto;
}
function transformMessage(msg: MessageResponse): MessageDto {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    sender: {
      id: msg.senderId,
      username: msg.senderName, // Backend không trả username riêng, tạm dùng senderName
      displayName: msg.senderName,
      avatarUrl: msg.senderAvatar || undefined,
    },
    content: msg.content,
    messageType: msg.messageType,
    sentAt: msg.sentAt,
    receiptStatus: msg.receiptStatus,
    fileUrl: msg.fileUrl || undefined,
    fileName: msg.fileName || undefined,
    fileSize: msg.fileSize || undefined,
    fileType: msg.fileType || undefined,
    thumbnailUrl: msg.thumbnailUrl || undefined,
  };
}
export async function fetchMessages(conversationId: number) {
  const endpoint = `/messages/conversation/${conversationId}`;
  const responses = await apiFetch<MessageResponse[]>(endpoint);
  const messages = responses.map(transformMessage);
  messages.sort((a, b) => {
    const dateA = new Date(a.sentAt).getTime();
    const dateB = new Date(b.sentAt).getTime();
    return dateA - dateB;
  });
  return messages;
}
export async function sendMessage(payload: SendMessageRequest) {
  const response = await apiFetch<MessageResponse>('/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversationId: payload.conversationId,
      content: payload.content,
      messageType: payload.messageType || 'TEXT',
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      fileType: payload.fileType,
      thumbnailUrl: payload.thumbnailUrl,
    }),
  });
  return {
    message: transformMessage(response),
  };
}
export async function markConversationAsRead(conversationId: number) {
  try {
    await apiFetch<void>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  } catch (error) {}
}