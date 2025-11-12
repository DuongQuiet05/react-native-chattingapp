import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStory,
  getStories,
  getUserStories,
  getStory,
  viewStory,
  deleteStory,
  type CreateStoryRequest,
} from '@/lib/api/stories';
import { queryKeys } from '@/lib/api/query-keys';

export function useStories() {
  return useQuery({
    queryKey: queryKeys.stories.all,
    queryFn: () => getStories(),
  });
}

export function useUserStories(userId: number) {
  return useQuery({
    queryKey: queryKeys.stories.user(userId),
    queryFn: () => getUserStories(userId),
    enabled: !!userId,
  });
}

export function useStory(storyId: number) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId),
    queryFn: () => getStory(storyId),
    enabled: !!storyId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateStoryRequest) => createStory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useViewStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: number) => viewStory(storyId),
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: number) => deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

