import type { UserProfile } from './auth';
import { apiFetch } from './http-client';
import type { MessageDto } from './messages';
export type ConversationType = 'PRIVATE' | 'GROUP';
interface ConversationResponse {
  id: number;
  type: ConversationType;
  groupName?: string | null;
  groupAvatarUrl?: string | null;
  createdBy: number;
  createdAt: string;
  participants: Array<{
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    status?: 'ONLINE' | 'OFFLINE' | 'AWAY';
    lastSeen?: string | null;
  }>;
  lastMessage?: {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string | null;
    content: string;
    messageType: string;
    sentAt: string;
  } | null;
}
export interface ConversationSummary {
  id: number;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  participantStatus?: 'ONLINE' | 'OFFLINE' | 'AWAY'; // Status của participant (cho PRIVATE conversation)
  otherUserId?: number; // ID của người chat cùng (cho PRIVATE conversation)
}
export interface ConversationParticipant {
  id: number;
  role: 'ADMIN' | 'MEMBER';
  user: UserProfile;
  joinedAt: string;
}
export interface ConversationDetail extends ConversationSummary {
  participants: ConversationParticipant[];
  messages?: MessageDto[];
}
function transformConversation(
  conv: ConversationResponse,
  currentUserId?: number,
): ConversationSummary {
  let title = '';
  let avatarUrl: string | undefined;
  let participantStatus: 'ONLINE' | 'OFFLINE' | 'AWAY' | undefined;
  if (conv.type === 'GROUP') {
    title = conv.groupName || 'Nhóm không tên';
    avatarUrl = conv.groupAvatarUrl || undefined;
  } else {
    const otherUser = conv.participants.find((p) => p.id !== currentUserId);
    if (otherUser) {
      title = otherUser.displayName;
      avatarUrl = otherUser.avatarUrl || undefined;
      participantStatus = otherUser.status;
    } else {
      title = 'Người dùng';
    }
  }
  return {
    id: conv.id,
    type: conv.type,
    title,
    avatarUrl,
    lastMessagePreview: conv.lastMessage?.content,
    lastMessageAt: conv.lastMessage?.sentAt,
    unreadCount: 0, // Backend chưa có field này
    participantStatus,
    otherUserId: conv.type === 'PRIVATE' ? conv.participants.find(p => p.id !== currentUserId)?.id : undefined,
  };
}
export async function fetchConversations(currentUserId?: number) {
  const responses = await apiFetch<ConversationResponse[]>('/conversations');
  return responses.map((conv) => transformConversation(conv, currentUserId));
}
export async function fetchConversationDetail(conversationId: number, currentUserId?: number) {
  const response = await apiFetch<ConversationResponse>(`/conversations/${conversationId}`);
  const summary = transformConversation(response, currentUserId);
  // Convert participants
  const participants: ConversationParticipant[] = response.participants.map((p) => ({
    id: p.id,
    role: 'MEMBER', // Backend chưa có role info
    user: {
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl || undefined,
      status: p.status,
    },
    joinedAt: response.createdAt, // Tạm dùng createdAt
  }));
  return {
    ...summary,
    participants,
  };
}
export interface CreateConversationRequest {
  type: 'PRIVATE' | 'GROUP';
  groupName?: string;
  participantIds: number[];
}
export interface CreateConversationResponse {
  id: number;
  type: ConversationType;
  groupName?: string;
  groupAvatarUrl?: string;
  createdBy: number;
  createdAt: string;
  participants: Array<{
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
    status?: string;
  }>;
}
/**
 * Tạo conversation mới (private hoặc group)
 */
export async function createConversation(payload: CreateConversationRequest) {
  return apiFetch<CreateConversationResponse>('/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
/**
 * Tạo hoặc lấy conversation private với 1 người dùng
 */
export async function getOrCreatePrivateConversation(userId: number) {
  return createConversation({
    type: 'PRIVATE',
    participantIds: [userId],
  });
}