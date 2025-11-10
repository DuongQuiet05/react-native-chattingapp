import { useQuery } from '@tanstack/react-query';
import { getReceivedFriendRequests } from '@/lib/api/friends';
export const friendRequestsQueryKeys = {
  received: ['friend-requests', 'received'] as const,
};
export function useFriendRequests() {
  return useQuery({
    queryKey: friendRequestsQueryKeys.received,
    queryFn: getReceivedFriendRequests,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });
}