// Polyfill for BigInt (required by @stomp/stompjs if not available)
if (typeof BigInt === 'undefined') {
    global.BigInt = require('big-integer');
}

import 'text-encoding';
import { AuthProvider } from "@/contexts/auth-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { StompProvider } from "@/providers/stomp-provider";
// import { NotificationProvider } from "@/providers/notification-provider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Component, useMemo, type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
// Memoize screen options to prevent re-renders
const INDEX_SCREEN_OPTIONS = { headerShown: false };
const AUTH_SCREEN_OPTIONS = { headerShown: false };
const TABS_SCREEN_OPTIONS = { headerShown: false };
const CHAT_SCREEN_OPTIONS = { headerShown: false };
const MODAL_SCREEN_OPTIONS = { presentation: "modal" as const, title: "Modal" };
export const unstable_settings = {
  anchor: "index",
};
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorDetail}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Memoize theme to prevent re-renders
  const theme = useMemo(
    () => (colorScheme === "dark" ? DarkTheme : DefaultTheme),
    [colorScheme]
  );
  return (
    <ErrorBoundary>
      <ThemeProvider value={theme}>
        <SafeAreaView style={{ flex: 1 }}>
          <ReactQueryProvider>
            <AuthProvider>
              <StompProvider>
                <Stack>
                  <Stack.Screen name="index" options={INDEX_SCREEN_OPTIONS} />
                  <Stack.Screen name="(auth)" options={AUTH_SCREEN_OPTIONS} />
                  <Stack.Screen name="(tabs)" options={TABS_SCREEN_OPTIONS} />
                  <Stack.Screen name="chat" options={CHAT_SCREEN_OPTIONS} />
                  <Stack.Screen name="stories" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="modal" options={MODAL_SCREEN_OPTIONS} />
                </Stack>
                <StatusBar style="auto" />
              </StompProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </SafeAreaView>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});