import { apiFetch } from './http-client';
export interface UserProfileDto {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  lastSeen?: string | null;
  createdAt?: string;
}
export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
}
export async function getUserProfile(userId?: number) {
  if (userId) {
    return apiFetch<UserProfileDto>(`/users/${userId}/profile`);
  }
  return apiFetch<UserProfileDto>('/users/me/profile');
}
export async function updateProfile(data: UpdateProfileRequest) {
  return apiFetch<UserProfileDto>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}