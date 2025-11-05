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
  const hasRedirected = useRef(false);

  useEffect(() => {
    const checkIntroStatus = async () => {
      try {
        const introSeen = await AsyncStorage.getItem(INTRO_SEEN_KEY);
        setHasSeenIntro(introSeen === 'true');
      } catch (error) {
        console.error('Error checking intro status:', error);
        setHasSeenIntro(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkIntroStatus();
  }, []);

  // Handle redirect logic
  useEffect(() => {
    // Don't redirect if still loading or already redirected
    if (isLoading || hasSeenIntro === null || status === 'loading' || hasRedirected.current) {
      return;
    }

    let redirectHref: string | null = null;

    // If hasn't seen intro, redirect to intro
    if (hasSeenIntro === false) {
      redirectHref = '/(auth)/intro-1';
    }
    // If has seen intro
    else if (hasSeenIntro === true) {
      if (status === 'authenticated') {
        redirectHref = '/(tabs)/feed';
      } else {
        redirectHref = '/(auth)/login';
      }
    }

    // Fallback to intro if no redirect determined
    if (!redirectHref) {
      redirectHref = '/(auth)/intro-1';
    }

    // Perform redirect once
    if (redirectHref && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectHref as any);
    }
  }, [isLoading, hasSeenIntro, status, router]);

  // Show loading state
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