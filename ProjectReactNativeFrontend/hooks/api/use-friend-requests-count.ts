import { getPendingRequestsCount } from '@/lib/api/friends';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
export const friendRequestCountQueryKeys = {
  all: ['friendRequestCount'] as const,
};
/**
 * Hook để lấy số lượng lời mời kết bạn đang chờ xử lý
 * Tự động refetch mỗi 30 giây để cập nhật badge
 */
export function useFriendRequestsCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: friendRequestCountQueryKeys.all,
    queryFn: getPendingRequestsCount,
    enabled: status === 'authenticated', // Only fetch when authenticated
    refetchInterval: status === 'authenticated' ? 30000 : false, // Only refetch when authenticated
    refetchOnWindowFocus: status === 'authenticated',
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}