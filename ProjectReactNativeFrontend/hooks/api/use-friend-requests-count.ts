import { getPendingRequestsCount } from '@/lib/api/friends';
import { useQuery } from '@tanstack/react-query';

export const friendRequestCountQueryKeys = {
  all: ['friendRequestCount'] as const,
};

/**
 * Hook để lấy số lượng lời mời kết bạn đang chờ xử lý
 * Tự động refetch mỗi 30 giây để cập nhật badge
 */
export function useFriendRequestsCount() {
  return useQuery({
    queryKey: friendRequestCountQueryKeys.all,
    queryFn: getPendingRequestsCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
