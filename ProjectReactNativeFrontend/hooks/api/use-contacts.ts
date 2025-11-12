import { useQuery } from '@tanstack/react-query';
import { fetchContacts } from '@/lib/api/users';
import { queryKeys } from '@/lib/api/query-keys';

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts.all,
    queryFn: fetchContacts,
    staleTime: 60_000,
  });
}

// Export contactQueryKeys for backward compatibility
export const contactQueryKeys = {
  all: queryKeys.contacts.all,
};