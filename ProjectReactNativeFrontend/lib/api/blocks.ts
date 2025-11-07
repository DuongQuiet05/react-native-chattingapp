import { apiFetch } from './http-client';

export interface BlockedUser {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface BlockedUsersResponse {
  blockedUsers: BlockedUser[];
  blockedUserIds: number[];
}

export async function blockUser(userId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/blocks/${userId}`, {
    method: 'POST',
  });
}

export async function unblockUser(userId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/blocks/${userId}`, {
    method: 'DELETE',
  });
}

export async function getBlockedUsers() {
  return apiFetch<BlockedUsersResponse>('/blocks');
}

export async function checkBlocked(userId: number) {
  return apiFetch<{ isBlocked: boolean }>(`/blocks/${userId}/check`);
}

