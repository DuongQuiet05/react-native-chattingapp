import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function CreatePostTab() {
  useFocusEffect(
    useCallback(() => {
      // Chuyển đến trang create-post khi tab này được focus
      const timer = setTimeout(() => {
        console.log('🔄 Navigating to create-post from index tab');
        router.push('/(tabs)/create-post' as any);
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

