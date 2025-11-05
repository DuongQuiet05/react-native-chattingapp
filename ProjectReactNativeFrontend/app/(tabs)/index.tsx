import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function CreatePostTab() {
  useEffect(() => {
    // Chuyển đến trang create-post khi tab này được nhấn
    router.replace('/(tabs)/create-post' as any);
  }, []);

  return <View />;
}

