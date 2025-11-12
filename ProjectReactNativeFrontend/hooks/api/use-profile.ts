import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateProfile, type UpdateProfileRequest } from '@/lib/api/profile';
import { useAuth } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/api/query-keys';

export function useUserProfile(userId?: number) {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => getUserProfile(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(user.id) });
      }
    },
  });
}