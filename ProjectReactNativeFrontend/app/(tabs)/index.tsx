import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
export default function CreatePostTab() {
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {router.push('/(tabs)/create-post' as any);
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }, [])
  );
  // Show loading while navigating
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4FD' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}