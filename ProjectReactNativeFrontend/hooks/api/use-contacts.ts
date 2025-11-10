import { useQuery } from '@tanstack/react-query';
import { fetchContacts } from '@/lib/api/users';
export const contactQueryKeys = {
  all: ['contacts'] as const,
};
export function useContacts() {
  return useQuery({
    queryKey: contactQueryKeys.all,
    queryFn: fetchContacts,
    staleTime: 60_000,
  });
}