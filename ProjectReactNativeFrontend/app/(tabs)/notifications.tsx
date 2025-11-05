import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useUnreadNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/api/use-notifications';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NOTIFICATION_ICONS = {
  MESSAGE: 'message.fill',
  FRIEND_REQUEST: 'person.badge.plus',
  FRIEND_ACCEPTED: 'checkmark.circle.fill',
  POST_COMMENT: 'bubble.left.fill',
  POST_REACTION: 'heart.fill',
  COMMENT_REPLY: 'bubble.right.fill',
};

function NotificationItem({ notification }: { notification: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const markAsRead = useMarkNotificationAsRead();

  const handlePress = async () => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Navigate based on notification type
    switch (notification.notificationType) {
      case 'FRIEND_REQUEST':
        router.push('/(tabs)/friend-requests' as any);
        break;
      case 'MESSAGE':
        if (notification.relatedEntityId) {
          router.push(`/chat/${notification.relatedEntityId}` as any);
        }
        break;
      case 'POST_COMMENT':
      case 'POST_REACTION':
      case 'COMMENT_REPLY':
        if (notification.relatedEntityId) {
          // Navigate to post
          router.push(`/(tabs)/feed` as any);
        }
        break;
      default:
        break;
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Card
        style={[
          styles.notificationItem,
          !notification.isRead && { backgroundColor: colors.backgroundSecondary },
        ]}>
        <View style={styles.notificationContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            <IconSymbol
              name={NOTIFICATION_ICONS[notification.notificationType as keyof typeof NOTIFICATION_ICONS] || 'bell.fill'}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {notification.title}
            </Text>
            {notification.content && (
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
                {notification.content}
              </Text>
            )}
            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
              {dayjs(notification.createdAt).fromNow()}
            </Text>
          </View>
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [page, setPage] = useState(0);
  const { data, isLoading, isRefetching, refetch } = useNotifications(page, 20);
  const { data: unreadData } = useUnreadNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleRefresh = () => {
    refetch();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      Alert.alert('Thành công', 'Đã đánh dấu tất cả đã đọc');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc');
    }
  };

  const notifications = data?.content || [];
  const unreadCount = unreadData?.notifications?.length || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markAllAsRead.isPending}>
            <Text style={[styles.markAllButton, { color: colors.primary }]}>
              {markAllAsRead.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        {isLoading && page === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="bell.slash" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Không có thông báo nào
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  notificationItem: {
    marginBottom: Spacing.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});

