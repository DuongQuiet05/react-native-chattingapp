import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContacts } from '@/hooks/api/use-contacts';
import { useFriendRequests } from '@/hooks/api/use-friend-requests';
import { useFriendRequestsCount } from '@/hooks/api/use-friend-requests-count';
import type { FriendRequest } from '@/lib/api/friends';
import type { Contact } from '@/lib/api/users';

dayjs.extend(relativeTime);

export default function ContactsScreen() {
  const { data: contacts, isLoading: contactsLoading, isError: contactsError, refetch: refetchContacts, isFetching: contactsFetching } = useContacts();
  const { data: friendRequests, isLoading: requestsLoading, isError: requestsError, refetch: refetchRequests, isFetching: requestsFetching } = useFriendRequests();
  const { data: friendRequestCount } = useFriendRequestsCount();

  const sections = useMemo(() => {
    const result = [];
    
    // Add friend requests section if there are any
    if (friendRequests && friendRequests.length > 0) {
      result.push({
        title: 'Lời mời kết bạn',
        data: friendRequests,
        type: 'requests' as const,
      });
    }
    
    // Add friends section
    if (contacts && contacts.length > 0) {
      result.push({
        title: 'Bạn bè',
        data: contacts,
        type: 'friends' as const,
      });
    }
    
    return result;
  }, [friendRequests, contacts]);

  const handleRefresh = useCallback(() => {
    void refetchContacts();
    void refetchRequests();
  }, [refetchContacts, refetchRequests]);

  const renderFriendRequestItem = useCallback(({ item }: { item: FriendRequest }) => {
    const timeAgo = dayjs(item.createdAt).fromNow();
    
    return (
      <TouchableOpacity 
        style={styles.requestContainer}
        onPress={() => {
          router.push('/(tabs)/friend-requests' as any);
        }}>
        <Image
          source={
            item.sender.avatarUrl
              ? { uri: item.sender.avatarUrl }
              : require('@/assets/images/icon.png')
          }
          style={styles.avatar}
        />
        
        <View style={styles.requestInfo}>
          <ThemedText type="subtitle">{item.sender.displayName ?? item.sender.username}</ThemedText>
          <ThemedText style={styles.itemSubtitle}>
            {item.message || 'muốn kết bạn với bạn'}
          </ThemedText>
          <ThemedText style={styles.timeText}>{timeAgo}</ThemedText>
        </View>

        <View style={styles.requestBadge}>
          <Ionicons name="person-add" size={20} color="#ff3b30" />
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderFriendItem = useCallback(({ item }: { item: Contact }) => {
    const lastSeenLabel = item.lastSeen ? dayjs(item.lastSeen).fromNow() : 'Không rõ';
    const isOnline = item.status === 'ONLINE';

    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => {
          // Navigate to chat with this contact
          router.push(`/chat/${item.id}`);
        }}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              item.avatarUrl
                ? { uri: item.avatarUrl }
                : require('@/assets/images/icon.png')
            }
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        
        <View style={styles.contactInfo}>
          <ThemedText type="subtitle">{item.displayName ?? item.username}</ThemedText>
          <ThemedText style={styles.itemSubtitle}>
            {isOnline ? 'Đang hoạt động' : `Hoạt động ${lastSeenLabel}`}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  }, []);

  const renderSectionHeader = useCallback(({ section }: { section: typeof sections[0] }) => (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
      {section.type === 'requests' && section.data.length > 0 && (
        <TouchableOpacity onPress={() => router.push('/(tabs)/friend-requests' as any)}>
          <ThemedText style={styles.seeAllText}>Xem tất cả</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  ), []);

  const renderItem = useCallback(({ item, section }: { item: any; section: typeof sections[0] }) => {
    if (section.type === 'requests') {
      return renderFriendRequestItem({ item });
    }
    return renderFriendItem({ item });
  }, [renderFriendRequestItem, renderFriendItem]);

  const isLoading = contactsLoading || requestsLoading;
  const isError = contactsError && requestsError;
  const isFetching = contactsFetching || requestsFetching;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ThemedView style={styles.centered}>
          <ThemedText>Không thể tải danh sách</ThemedText>
          <ThemedText style={styles.retry} onPress={handleRefresh}>
            Thử lại
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header with action buttons */}
        <View style={styles.header}>
        <ThemedText type="title">Danh bạ</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/search-users' as any)}>
            <Ionicons name="person-add" size={24} color="#0a84ff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/friend-requests' as any)}>
            <Ionicons name="notifications" size={24} color="#0a84ff" />
            {friendRequestCount !== undefined && friendRequestCount > 0 && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {friendRequestCount > 99 ? '99+' : friendRequestCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <ThemedText style={styles.emptyTitle}>Chưa có bạn bè nào</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tìm kiếm và kết bạn với người khác để bắt đầu trò chuyện
          </ThemedText>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => router.push('/(tabs)/search-users' as any)}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <ThemedText style={styles.addFriendButtonText}>Tìm bạn bè</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshing={isFetching}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  retry: {
    color: '#0a84ff',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0a84ff',
    fontWeight: '500',
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    gap: 12,
  },
  requestInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  requestBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  itemSubtitle: {
    opacity: 0.7,
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a84ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
