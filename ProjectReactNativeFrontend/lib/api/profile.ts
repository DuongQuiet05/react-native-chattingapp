import { apiFetch } from './http-client';
export interface UserProfileDto {
  // Basic Info
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  
  // Profile Details
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  
  // Contact Info
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  
  // Status & Role
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  role?: 'USER' | 'ADMIN';
  isBlocked?: boolean;
  
  // Timestamps
  lastSeen?: string | null;
  createdAt?: string;
  updatedAt?: string;
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