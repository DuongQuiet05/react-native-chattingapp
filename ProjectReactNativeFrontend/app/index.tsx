import { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/auth-context';

const INTRO_SEEN_KEY = '@intro_seen';

export default function IndexScreen() {
  const { status } = useAuth();
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Memoize redirect logic để tránh re-render không cần thiết
  const redirectHref = useMemo(() => {
    if (isLoading || hasSeenIntro === null) {
      return null;
    }

    if (hasSeenIntro === false) {
      return '/(auth)/intro-1';
    }

    if (hasSeenIntro === true) {
      if (status === 'authenticated') {
        return '/(tabs)';
      }
      return '/(auth)/login';
    }

    return null;
  }, [isLoading, hasSeenIntro, status]);

  if (isLoading || hasSeenIntro === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (redirectHref) {
    return <Redirect href={redirectHref as any} />;
  }

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