import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createComment,
  deleteComment,
  getPostComments,
  getPostCommentsPaginated,
  type CreateCommentRequest,
} from '@/lib/api/comments';

export function usePostComments(postId: number) {
  return useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
  });
}

export function usePostCommentsPaginated(postId: number, page = 0, size = 20) {
  return useQuery({
    queryKey: ['postCommentsPaginated', postId, page, size],
    queryFn: () => getPostCommentsPaginated(postId, page, size),
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => createComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['postCommentsPaginated', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      queryClient.invalidateQueries({ queryKey: ['postCommentsPaginated'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

