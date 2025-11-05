import { apiFetch } from './http-client';

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
  return apiFetch<{ blockedUserIds: number[] }>('/blocks');
}

export async function checkBlocked(userId: number) {
  return apiFetch<{ isBlocked: boolean }>(`/blocks/${userId}/check`);
}

