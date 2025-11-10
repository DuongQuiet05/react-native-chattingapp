import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStory,
  getStories,
  getUserStories,
  getStory,
  viewStory,
  deleteStory,
  type CreateStoryRequest,
  type StoryDto,
} from '@/lib/api/stories';

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => getStories(),
  });
}

export function useUserStories(userId: number) {
  return useQuery({
    queryKey: ['stories', 'user', userId],
    queryFn: () => getUserStories(userId),
    enabled: !!userId,
  });
}

export function useStory(storyId: number) {
  return useQuery({
    queryKey: ['stories', storyId],
    queryFn: () => getStory(storyId),
    enabled: !!storyId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateStoryRequest) => createStory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useViewStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: number) => viewStory(storyId),
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: number) => deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

