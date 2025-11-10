import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateProfile, type UpdateProfileRequest } from '@/lib/api/profile';
import { useAuth } from '@/contexts/auth-context';
export function useUserProfile(userId?: number) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId),
  });
}
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      }
    },
  });
}