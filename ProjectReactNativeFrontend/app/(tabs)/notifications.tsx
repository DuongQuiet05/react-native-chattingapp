import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/api/use-notifications';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { NotificationDto } from '@/lib/api/notifications';
dayjs.extend(relativeTime);
function NotificationItem({ notification }: { notification: NotificationDto }) {
  const markAsRead = useMarkNotificationAsRead();
  const handlePress = async () => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }
    // Navigate based on notification type
    switch (notification.notificationType) {
      case 'POST_COMMENT':
      case 'POST_REACTION':
        if (notification.relatedEntityId) {
          router.push(`/(tabs)/post-detail?postId=${notification.relatedEntityId}` as any);
        }
        break;
      case 'COMMENT_REPLY':
        // For comment reply, relatedEntityId is now postId (fixed in backend)
        if (notification.relatedEntityId) {
          router.push(`/(tabs)/post-detail?postId=${notification.relatedEntityId}` as any);
        }
        break;
      default:
        break;
    }
  };
  const getNotificationText = () => {
    const title = notification.title || '';
    // Extract username from title (e.g., "@valerieazr90 Liked your comments")
    const match = title.match(/@(\w+)/);
    if (match) {
      return {
        username: match[1],
        action: title.replace(/@\w+/, '').trim(),
      };
    }
    return {
      username: '',
      action: title,
    };
  };
  const { username, action } = getNotificationText();
  const createdAt = dayjs(notification.createdAt);
  const isToday = createdAt.isSame(dayjs(), 'day');
  const isYesterday = createdAt.isSame(dayjs().subtract(1, 'day'), 'day');
  let timeDisplay = '';
  if (isToday) {
    const hours = createdAt.diff(dayjs(), 'hours');
    timeDisplay = hours === 0 ? 'just now' : `${Math.abs(hours)}hr ago`;
  } else if (isYesterday) {
    timeDisplay = createdAt.format('DD MMM YYYY');
  } else {
    timeDisplay = createdAt.format('DD MMM YYYY');
  }
  const showFollowingButton = notification.notificationType === 'FRIEND_ACCEPTED';
  return (
    <TouchableOpacity onPress={handlePress} style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            <Text style={styles.username}>@{username}</Text> {action}
          </Text>
          <Text style={styles.notificationTime}>{timeDisplay}</Text>
        </View>
        {showFollowingButton ? (
          <View style={styles.followingButton}>
            <Text style={styles.followingButtonText}>Following</Text>
          </View>
        ) : notification.relatedEntityId ? (
          null
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [page, setPage] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const { data, isLoading, isRefetching, refetch } = useNotifications(page, 20);
  const markAllAsRead = useMarkAllNotificationsAsRead();
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  const handleRefresh = () => {
    refetch();
  };
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc');
    }
  };
  const handleEllipsisPress = () => {
    setShowMenu(true);
  };
  const handleMarkAllReadPress = async () => {
    setShowMenu(false);
    await handleMarkAllRead();
  };
  const filteredNotifications = useMemo(() => {
    const all = data?.content || [];const filtered = all.filter(
      (notification) =>
        notification.notificationType === 'POST_COMMENT' ||
        notification.notificationType === 'POST_REACTION' ||
        notification.notificationType === 'COMMENT_REPLY'
    );return filtered;
  }, [data?.content]);
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.isRead).length;
  }, [filteredNotifications]);
  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationDto[] } = {};
    filteredNotifications.forEach((notification) => {
      const createdAt = dayjs(notification.createdAt);
      const isToday = createdAt.isSame(dayjs(), 'day');
      const isYesterday = createdAt.isSame(dayjs().subtract(1, 'day'), 'day');
      let groupKey = '';
      if (isToday) {
        groupKey = 'Today';
      } else if (isYesterday) {
        groupKey = 'Yesterday';
      } else {
        groupKey = createdAt.format('DD MMM YYYY');
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    return groups;
  }, [filteredNotifications]);
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={[styles.container, { backgroundColor: '#fff' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <TouchableOpacity onPress={handleEllipsisPress}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {/* Menu Popup */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}>
          <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleMarkAllReadPress}
                activeOpacity={0.7}>
                <Ionicons name="checkmark-done" size={20} color="#000" />
                <Text style={styles.menuItemText}>Đánh dấu tất cả đã đọc</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        {/* Notifications List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
          {isLoading && page === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : Object.keys(groupedNotifications).length > 0 ? (
            Object.entries(groupedNotifications).map(([date, items]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateGroupTitle}>{date}</Text>
                {items.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Không có thông báo nào
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inviteText: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});