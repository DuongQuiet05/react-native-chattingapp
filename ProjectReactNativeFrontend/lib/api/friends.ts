import { apiFetch } from './http-client';

// Types
export type RelationshipStatus = 
  | 'STRANGER'       // Người lạ - có thể gửi lời mời
  | 'FRIEND'         // Đã là bạn bè
  | 'REQUEST_SENT'   // Đã gửi lời mời
  | 'REQUEST_RECEIVED' // Đã nhận lời mời từ người này
  | 'BLOCKED';       // Đã chặn

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface UserSearchResult {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  mutualFriendsCount: number;
  relationshipStatus: RelationshipStatus;
  requestId?: number; // ID của friend request nếu có
}

export interface FriendProfile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

export interface FriendRequest {
  id: number;
  sender: FriendProfile;
  receiver: FriendProfile;
  status: FriendRequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendFriendRequestPayload {
  receiverId: number;
  message?: string;
}

export interface FriendRequestCountResponse {
  count: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface PrivacySettings {
  userId: number;
  allowFindByPhone: boolean;
  allowFriendRequestFromStrangers: boolean;
  showPhoneToFriends: boolean;
}

// API Functions

/**
 * Tìm kiếm người dùng theo số điện thoại, username, hoặc display name
 * @param query - Từ khóa tìm kiếm (tối thiểu 2 ký tự)
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  // Validate query length (backend requires at least 2 characters)
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  return apiFetch<UserSearchResult[]>(
    `/friends/search?query=${encodeURIComponent(query.trim())}`
  );
}

/**
 * Gửi lời mời kết bạn
 */
export async function sendFriendRequest(
  payload: SendFriendRequestPayload
): Promise<FriendRequest> {
  return apiFetch<FriendRequest>('/friends/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Lấy danh sách lời mời kết bạn đã nhận
 */
export async function getReceivedFriendRequests(): Promise<FriendRequest[]> {
  return apiFetch<FriendRequest[]>('/friends/requests/received');
}

/**
 * Lấy danh sách lời mời kết bạn đã gửi
 */
export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  return apiFetch<FriendRequest[]>('/friends/requests/sent');
}

/**
 * Đếm số lời mời kết bạn chờ xử lý
 */
export async function getPendingRequestsCount(): Promise<number> {
  const response = await apiFetch<FriendRequestCountResponse>(
    '/friends/requests/count'
  );
  return response.count;
}

/**
 * Chấp nhận lời mời kết bạn
 */
export async function acceptFriendRequest(requestId: number): Promise<ApiResponse> {
  return apiFetch<ApiResponse>(`/friends/requests/${requestId}/accept`, {
    method: 'POST',
  });
}

/**
 * Từ chối lời mời kết bạn
 */
export async function rejectFriendRequest(requestId: number): Promise<ApiResponse> {
  return apiFetch<ApiResponse>(`/friends/requests/${requestId}/reject`, {
    method: 'POST',
  });
}

/**
 * Hủy lời mời kết bạn đã gửi
 */
export async function cancelFriendRequest(requestId: number): Promise<ApiResponse> {
  return apiFetch<ApiResponse>(`/friends/requests/${requestId}`, {
    method: 'DELETE',
  });
}

/**
 * Lấy danh sách bạn bè
 */
export async function getFriendsList(): Promise<FriendProfile[]> {
  try {
    const response = await apiFetch<FriendProfile[]>('/friends');
    console.log('✅ Friends list response:', response);
    return Array.isArray(response) ? response : [];
  } catch (error: any) {
    console.error('❌ Error fetching friends list:', error);
    console.error('Error status:', error?.status);
    console.error('Error details:', error?.details);
    // Nếu là lỗi 400 và có message, có thể là backend issue
    if (error?.status === 400) {
      console.warn('⚠️ Backend returned 400 for /friends endpoint. This might indicate a backend issue.');
    }
    throw error;
  }
}

/**
 * Xóa bạn bè
 */
export async function removeFriend(friendId: number): Promise<ApiResponse> {
  return apiFetch<ApiResponse>(`/friends/${friendId}`, {
    method: 'DELETE',
  });
}

/**
 * Lấy cài đặt quyền riêng tư
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  return apiFetch<PrivacySettings>('/privacy');
}

/**
 * Cập nhật cài đặt quyền riêng tư
 */
export async function updatePrivacySettings(
  settings: Partial<Omit<PrivacySettings, 'userId'>>
): Promise<PrivacySettings> {
  return apiFetch<PrivacySettings>('/privacy', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

/**
 * Lấy relationship status với một user cụ thể
 */
export interface RelationshipStatusResponse {
  relationshipStatus: RelationshipStatus;
  mutualFriendsCount: number;
}

export async function getRelationshipStatus(userId: number): Promise<RelationshipStatusResponse> {
  return apiFetch<RelationshipStatusResponse>(`/friends/relationship/${userId}`);
}