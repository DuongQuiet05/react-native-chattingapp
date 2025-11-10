import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPost,
  deletePost,
  getFeed,
  getPostById,
  getUserPosts,
  reactToPost,
  removePostReaction,
  type CreatePostRequest,
  type PostReactionRequest,
} from '@/lib/api/posts';
export function useFeed(page = 0, size = 20) {
  return useQuery({
    queryKey: ['feed', page, size],
    queryFn: () => getFeed(page, size),
  });
}
export function useUserPosts(userId: number, page = 0, size = 20) {
  return useQuery({
    queryKey: ['userPosts', userId, page, size],
    queryFn: () => getUserPosts(userId, page, size),
    enabled: !!userId,
  });
}
export function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
}
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
export function useReactToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reaction }: { postId: number; reaction: PostReactionRequest }) =>
      reactToPost(postId, reaction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}
export function useRemovePostReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => removePostReaction(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}