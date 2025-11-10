import { Stack } from 'expo-router';
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="intro-1" options={{ headerShown: false }} />
      <Stack.Screen name="intro-2" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
    </Stack>
  );
}