import { Stack } from 'expo-router';

export default function StoriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'fullScreenModal',
      }}>
      <Stack.Screen name="[userId]" />
      <Stack.Screen name="create" />
    </Stack>
  );
}

