import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blockUser, checkBlocked, getBlockedUsers, unblockUser } from '@/lib/api/blocks';

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: () => getBlockedUsers(),
  });
}

export function useCheckBlocked(userId: number) {
  return useQuery({
    queryKey: ['checkBlocked', userId],
    queryFn: () => checkBlocked(userId),
    enabled: !!userId,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['checkBlocked'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['checkBlocked'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

