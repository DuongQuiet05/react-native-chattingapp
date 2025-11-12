import { getPendingRequestsCount } from '@/lib/api/friends';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Hook để lấy số lượng lời mời kết bạn đang chờ xử lý
 * Tự động refetch mỗi 30 giây để cập nhật badge
 */
export function useFriendRequestsCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.friendRequests.count,
    queryFn: getPendingRequestsCount,
    enabled: status === 'authenticated',
    refetchInterval: status === 'authenticated' ? 30000 : false,
    refetchOnWindowFocus: status === 'authenticated',
    staleTime: 10000,
  });
}

// Export friendRequestCountQueryKeys for backward compatibility
export const friendRequestCountQueryKeys = {
  all: queryKeys.friendRequests.count,
};