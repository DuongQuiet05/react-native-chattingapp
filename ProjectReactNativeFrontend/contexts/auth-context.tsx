import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const queryClientRef = useRef(queryClient);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');

  // Update ref whenever queryClient changes
  queryClientRef.current = queryClient;

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

  const signInRef = useRef<AuthContextValue['signIn']>();
  const signOutRef = useRef<AuthContextValue['signOut']>();
  const refreshProfileRef = useRef<AuthContextValue['refreshProfile']>();

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

  signInRef.current = signIn;

  const signOut = useCallback(async () => {
    // Set status first to prevent other components from accessing authenticated state
    setStatus('unauthenticated');
    setToken(null);
    setUser(null);
    setAccessToken(null);
    
    // Clear query cache immediately to prevent queries from running during logout
    // This must happen before clearAccessToken to prevent API calls
    queryClientRef.current?.clear();
    
    await clearAccessToken();
    // Xóa flag intro_seen để hiển thị lại intro khi đăng xuất
    try {
      await AsyncStorage.removeItem(INTRO_SEEN_KEY);
    } catch (error) {
      console.error('Error removing intro flag:', error);
    }
  }, []); // Empty deps - use ref instead

  signOutRef.current = signOut;

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    const profile = await fetchCurrentUser();
    setUser(profile);
  }, [token]);

  refreshProfileRef.current = refreshProfile;

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOutRef.current?.();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - ref is updated on every render

  // Use refs for callbacks to prevent context value changes
  // Only depend on actual values (status, token, user) to prevent unnecessary re-renders
  const value = useMemo<AuthContextValue>(
    () => ({ 
      status, 
      token, 
      user, 
      signIn: signInRef.current,
      signOut: signOutRef.current,
      refreshProfile: refreshProfileRef.current,
    }),
    [status, token, user], // Only depend on actual values, not callbacks
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
