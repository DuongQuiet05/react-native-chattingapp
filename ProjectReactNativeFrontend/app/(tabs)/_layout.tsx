import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useFriendRequestsCount } from '@/hooks/api/use-friend-requests-count';
import { useUnreadCount } from '@/hooks/api/use-notifications';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { status } = useAuth();
  const colorScheme = useColorScheme();
  const { data: friendRequestCount } = useFriendRequestsCount();
  const { data: unreadCount } = useUnreadCount();

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/" />;
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
          title: 'Feed',
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
          tabBarBadge: unreadCount && unreadCount.count > 0 ? unreadCount.count : undefined,
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
