import { useQuery } from '@tanstack/react-query';
import { getReceivedFriendRequests } from '@/lib/api/friends';
import { queryKeys } from '@/lib/api/query-keys';

export function useFriendRequests() {
  return useQuery({
    queryKey: queryKeys.friendRequests.received,
    queryFn: getReceivedFriendRequests,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// Export friendRequestsQueryKeys for backward compatibility
export const friendRequestsQueryKeys = {
  received: queryKeys.friendRequests.received,
};