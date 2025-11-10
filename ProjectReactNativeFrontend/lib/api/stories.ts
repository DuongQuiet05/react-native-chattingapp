import { apiFetch } from './http-client';

export interface StoryDto {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  musicUrl?: string | null;
  musicTitle?: string | null;
  textOverlay?: string | null;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewed: boolean;
  isOwn: boolean;
}

export interface CreateStoryRequest {
  imageUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  musicTitle?: string;
  textOverlay?: string;
}

export async function createStory(request: CreateStoryRequest): Promise<StoryDto> {
  return apiFetch<StoryDto>('/stories', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getStories(): Promise<StoryDto[]> {
  return apiFetch<StoryDto[]>('/stories');
}

export async function getUserStories(userId: number): Promise<StoryDto[]> {
  return apiFetch<StoryDto[]>(`/stories/user/${userId}`);
}

export async function getStory(storyId: number): Promise<StoryDto> {
  return apiFetch<StoryDto>(`/stories/${storyId}`);
}

export async function viewStory(storyId: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/stories/${storyId}/view`, {
    method: 'POST',
  });
}

export async function deleteStory(storyId: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/stories/${storyId}`, {
    method: 'DELETE',
  });
}

