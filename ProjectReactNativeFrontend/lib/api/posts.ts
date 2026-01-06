import { apiFetch } from './http-client';
export interface PostDto {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  privacyType: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  mediaUrls?: string[];
  location?: string | null;
  commentCount: number;
  reactionCount: number;
  shareCount?: number;        // Optional - may not be implemented yet
  repostCount?: number;       // Optional - may not be implemented yet
  bookmarkCount?: number;     // Optional - may not be implemented yet
  userReaction?: string | null;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CreatePostRequest {
  content: string;
  privacyType?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  mediaUrls?: string[];
  location?: string;
}
export interface PostReactionRequest {
  reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
}
export interface PostsPageResponse {
  content: PostDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export async function createPost(data: CreatePostRequest) {
  return apiFetch<PostDto>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function getFeed(page = 0, size = 20) {
  return apiFetch<PostsPageResponse>(`/posts/feed?page=${page}&size=${size}`);
}
export async function getUserPosts(userId: number, page = 0, size = 20) {
  return apiFetch<PostsPageResponse>(`/posts/user/${userId}?page=${page}&size=${size}`);
}
export async function getPostById(postId: number) {
  return apiFetch<PostDto>(`/posts/${postId}`);
}
export async function deletePost(postId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}`, {
    method: 'DELETE',
  });
}
export async function reactToPost(postId: number, reaction: PostReactionRequest) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/reactions`, {
    method: 'POST',
    body: JSON.stringify(reaction),
  });
}
export async function removePostReaction(postId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/reactions`, {
    method: 'DELETE',
  });
}