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
import { queryKeys } from '@/lib/api/query-keys';

export function useFeed(page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.posts.feed(page, size),
    queryFn: () => getFeed(page, size),
  });
}

export function useUserPosts(userId: number, page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.posts.user(userId, page, size),
    queryFn: () => getUserPosts(userId, page, size),
    enabled: !!userId,
  });
}

export function usePost(postId: number) {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
}

export function useReactToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reaction }: { postId: number; reaction: PostReactionRequest }) =>
      reactToPost(postId, reaction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useRemovePostReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => removePostReaction(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}