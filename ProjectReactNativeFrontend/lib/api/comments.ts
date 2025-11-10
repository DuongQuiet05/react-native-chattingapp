import { apiFetch } from './http-client';
export interface CommentDto {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  parentCommentId?: number | null;
  replies?: CommentDto[];
  createdAt: string;
  updatedAt: string;
}
export interface CreateCommentRequest {
  postId: number;
  content: string;
  parentCommentId?: number;
}
export interface CommentsPageResponse {
  content: CommentDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export async function createComment(data: CreateCommentRequest) {
  return apiFetch<CommentDto>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function getPostComments(postId: number) {
  return apiFetch<{ comments: CommentDto[] }>(`/comments/post/${postId}`);
}
export async function getPostCommentsPaginated(postId: number, page = 0, size = 20) {
  return apiFetch<CommentsPageResponse>(`/comments/post/${postId}/paginated?page=${page}&size=${size}`);
}
export async function deleteComment(commentId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}