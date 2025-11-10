import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
interface Props {
  children: ReactNode;
}
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
}
function useAppFocusManager() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      const isActive = status === 'active';
      focusManager.setFocused(isActive);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const onVisibilityChange = () => {
      focusManager.setFocused(!document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}
export function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(createQueryClient);
  useAppFocusManager();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}