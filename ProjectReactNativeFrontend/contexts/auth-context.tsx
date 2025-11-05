import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchCurrentUser, login, type LoginRequest, type UserProfile } from '@/lib/api/auth';
import { setAccessToken, setUnauthorizedHandler } from '@/lib/api/http-client';
import { clearAccessToken, getAccessToken, saveAccessToken } from '@/lib/storage/token-storage';

const INTRO_SEEN_KEY = '@intro_seen';

interface AuthContextValue {
  status: 'loading' | 'unauthenticated' | 'authenticated';
  token: string | null;
  user: UserProfile | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await getAccessToken();
        if (!storedToken) {
          setStatus('unauthenticated');
          return;
        }

        setAccessToken(storedToken);
        const profile = await fetchCurrentUser();
        setToken(storedToken);
        setUser(profile);
        setStatus('authenticated');
      } catch (error) {
        await clearAccessToken();
        setAccessToken(null);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    };

    bootstrap();
  }, []);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const response = await login(credentials);
    const accessToken = response.token;

    if (!accessToken) {
      throw new Error('Máy chủ không trả về token');
    }

    await saveAccessToken(accessToken);
    setAccessToken(accessToken);
    setToken(accessToken);

    // Tạo user profile từ response
    const profile: UserProfile = {
      id: response.userId,
      username: response.username,
      displayName: response.displayName,
      avatarUrl: response.avatarUrl ?? undefined,
      status: 'ONLINE',
    };
    setUser(profile);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearAccessToken();
    // Xóa flag intro_seen để hiển thị lại intro khi đăng xuất
    try {
      await AsyncStorage.removeItem(INTRO_SEEN_KEY);
    } catch (error) {
      console.error('Error removing intro flag:', error);
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    const profile = await fetchCurrentUser();
    setUser(profile);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, token, user, signIn, signOut, refreshProfile }),
    [status, token, user, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }

  return context;
}
