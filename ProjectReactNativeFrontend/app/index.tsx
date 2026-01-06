import { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/auth-context';
const INTRO_SEEN_KEY = '@intro_seen';
export default function IndexScreen() {
  const { status } = useAuth();
  const router = useRouter();
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirectedRef = useRef(false);
  // Check intro status on mount only
  useEffect(() => {
    let mounted = true;
    const checkIntroStatus = async () => {
      try {
        const introSeen = await AsyncStorage.getItem(INTRO_SEEN_KEY);
        if (mounted) {
          setHasSeenIntro(introSeen === 'true');
          setIsLoading(false);
        }
      } catch (error) {if (mounted) {
          setHasSeenIntro(false);
          setIsLoading(false);
        }
      }
    };
    checkIntroStatus();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    // Don't redirect if still loading or already redirected
    if (isLoading || hasSeenIntro === null || status === 'loading' || hasRedirectedRef.current) {
      return;
    }
    let redirectHref: string | null = null;
    // Determine redirect destination
    if (status === 'authenticated') {
      redirectHref = '/(tabs)/chats';
    } else {
      redirectHref = '/(auth)/intro-1';
    }
    // Fallback to intro if no redirect determined
    if (!redirectHref) {
      redirectHref = '/(auth)/intro-1';
    }
    // Only redirect once
    if (redirectHref && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Use setTimeout to ensure navigation happens after state updates
      const timeoutId = setTimeout(() => {
        try {
          router.replace(redirectHref as any);
        } catch (error) {// Reset flag on error to allow retry
          hasRedirectedRef.current = false;
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasSeenIntro, status]);
  // Show loading state while checking
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});