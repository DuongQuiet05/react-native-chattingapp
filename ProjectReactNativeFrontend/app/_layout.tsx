import { AuthProvider } from "@/contexts/auth-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { StompProvider } from "@/providers/stomp-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Component, type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("❌ App Error:", error, errorInfo);
  }

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

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <ReactQueryProvider>
            <AuthProvider>
              <NotificationProvider>
                <StompProvider>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="chat" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal", title: "Modal" }}
                    />
                  </Stack>
                  <StatusBar style="auto" />
                </StompProvider>
              </NotificationProvider>
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
