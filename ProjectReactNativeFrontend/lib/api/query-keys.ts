/**
 * Centralized Query Keys for TanStack Query
 * Tất cả query keys được định nghĩa ở đây để dễ quản lý và tránh lỗi typo
 */

export const queryKeys = {
  // Posts
  posts: {
    all: ['posts'] as const,
    feed: (page?: number, size?: number) => ['posts', 'feed', page, size] as const,
    detail: (postId: number) => ['posts', postId] as const,
    user: (userId: number, page?: number, size?: number) => ['posts', 'user', userId, page, size] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    list: (conversationId: number) => ['messages', conversationId] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    detail: (conversationId: number) => ['conversations', conversationId] as const,
  },

  // Reactions
  reactions: {
    message: (messageId: number) => ['reactions', 'message', messageId] as const,
  },

  // Stories
  stories: {
    all: ['stories'] as const,
    detail: (storyId: number) => ['stories', storyId] as const,
    user: (userId: number) => ['stories', 'user', userId] as const,
  },

  // Profile
  profile: {
    all: ['profile'] as const,
    detail: (userId?: number) => ['profile', userId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (page?: number, size?: number) => ['notifications', page, size] as const,
    unread: ['notifications', 'unread'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
    unreadMessageCount: ['notifications', 'unreadMessageCount'] as const,
  },

  // Friend Requests
  friendRequests: {
    all: ['friendRequests'] as const,
    received: ['friendRequests', 'received'] as const,
    count: ['friendRequests', 'count'] as const,
  },

  // Contacts/Friends
  contacts: {
    all: ['contacts'] as const,
  },
} as const;

