import { apiFetch } from './http-client';
export interface NotificationDto {
  id: number;
  notificationType: 'MESSAGE' | 'MESSAGE_REACTION' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'POST_COMMENT' | 'POST_REACTION' | 'COMMENT_REPLY';
  title: string;
  content?: string | null;
  relatedEntityId?: number | null;
  relatedEntityType?: string | null;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationsPageResponse {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export async function getNotifications(page = 0, size = 20) {
  return apiFetch<NotificationsPageResponse>(`/notifications?page=${page}&size=${size}`);
}
export async function getUnreadNotifications() {
  return apiFetch<{ notifications: NotificationDto[] }>('/notifications/unread');
}
export async function getUnreadCount() {
  return apiFetch<{ count: number }>('/notifications/unread/count');
}
export async function getUnreadMessageNotificationCount() {
  return apiFetch<{ count: number }>('/notifications/unread/message/count');
}
export async function markNotificationAsRead(notificationId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}
export async function markAllNotificationsAsRead() {
  return apiFetch<{ success: boolean; message: string }>('/notifications/read-all', {
    method: 'PUT',
  });
}