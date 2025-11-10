import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useFriendRequestsCount } from '@/hooks/api/use-friend-requests-count';
import { useUnreadCount, useUnreadMessageNotificationCount } from '@/hooks/api/use-notifications';
import { useUnreadMessagesCount } from '@/hooks/api/use-unread-messages-count';
import { useNotificationRealtime } from '@/hooks/api/use-notification-realtime';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
export default function TabLayout() {
  const { status } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  // Subscribe to notifications realtime
  useNotificationRealtime();
  // Only fetch data when authenticated to prevent API calls during logout
  // Use enabled option to disable queries when not authenticated
  const friendRequestCountQuery = useFriendRequestsCount();
  const unreadCountQuery = useUnreadCount(); // Badge cho notification (chuông) - chỉ POST_COMMENT, POST_REACTION, COMMENT_REPLY
  const unreadMessageNotificationCountQuery = useUnreadMessageNotificationCount(); // Badge cho tin nhắn từ notification API
  const unreadMessagesCountQuery = useUnreadMessagesCount(); // Badge cho tin nhắn từ conversations (real-time)
  // Only use data when authenticated, and queries are disabled when not authenticated
  const friendRequestCount = status === 'authenticated' ? friendRequestCountQuery.data : undefined;
  const unreadCount = status === 'authenticated' ? unreadCountQuery.data : undefined;
  const unreadMessageNotificationCount = status === 'authenticated' ? unreadMessageNotificationCountQuery.data : undefined;
  // Use unread messages count from conversations (real-time) for tab bar badge
  const unreadMessagesCount = status === 'authenticated' ? unreadMessagesCountQuery.data : undefined;
  const hasRedirectedRef = useRef(false);
  const previousStatusRef = useRef<'loading' | 'unauthenticated' | 'authenticated' | undefined>(undefined);
  // Handle redirect when status changes from authenticated to unauthenticated
  useEffect(() => {
    // Only redirect when transitioning from authenticated to unauthenticated
    const wasAuthenticated = previousStatusRef.current === 'authenticated';
    const isNowUnauthenticated = status === 'unauthenticated';
    if (wasAuthenticated && isNowUnauthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace('/(auth)/intro-1');
    }
    // Reset redirect flag when status becomes authenticated again
    if (status === 'authenticated') {
      hasRedirectedRef.current = false;
    }
    previousStatusRef.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Don't include router to prevent re-runs
  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }
  // Don't use Redirect component directly - it causes infinite loops
  // Use useEffect with router.replace instead
  // Show loading briefly while redirecting happens
  if (status !== 'authenticated') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Bảng tin',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Ẩn khỏi tab bar - đã gộp vào Feed
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Danh bạ',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
          tabBarBadge: friendRequestCount && friendRequestCount > 0 ? friendRequestCount : undefined,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <Ionicons name="add-circle-outline" size={32} color={"white"} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="message.fill" color={color} />,
          // Use unread messages count from conversations for real-time updates
          tabBarBadge: unreadMessagesCount && unreadMessagesCount.count > 0 ? (unreadMessagesCount.count > 99 ? '99+' : unreadMessagesCount.count) : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="create-post"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="post-detail"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="blocked-users"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      {/* Ẩn các tabs không dùng */}
      <Tabs.Screen
        name="search-users"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="friend-requests"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="privacy-settings"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Ẩn khỏi tab bar - route group
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});