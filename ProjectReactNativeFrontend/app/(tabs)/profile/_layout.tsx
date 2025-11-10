import { Stack } from 'expo-router';
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="[userId]"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
    </Stack>
  );
}