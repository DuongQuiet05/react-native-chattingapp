import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, SectionList, StyleSheet, TouchableOpacity, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        }}
        activeOpacity={0.7}>
        <Image
          source={{ uri: item.sender.avatarUrl || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.nameText}>{item.sender.displayName ?? item.sender.username}</Text>
          <Text style={styles.itemSubtitle}>
            {item.message || 'muốn kết bạn với bạn'}
          </Text>
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
        <View style={styles.requestBadge}>
          <Ionicons name="person-add" size={18} color="#fff" />
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
          router.push(`/(tabs)/profile/${item.id}` as any);
        }}
        activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.nameText}>{item.displayName ?? item.username}</Text>
          <Text style={styles.itemSubtitle}>
            {isOnline ? 'Đang hoạt động' : `Hoạt động ${lastSeenLabel}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    );
  }, []);
  const renderSectionHeader = useCallback(({ section }: { section: typeof sections[0] }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.type === 'requests' && section.data.length > 0 && (
        <TouchableOpacity onPress={() => router.push('/(tabs)/friend-requests' as any)}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
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
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Không thể tải danh sách</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Danh bạ</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                router.push('/(tabs)/search' as any);
              }}
              activeOpacity={0.7}>
              <Ionicons name="search" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/friend-requests' as any)}
              activeOpacity={0.7}>
              <Ionicons name="person-add" size={22} color="#000" />
              {friendRequestCount !== undefined && friendRequestCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {friendRequestCount > 99 ? '99+' : friendRequestCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có bạn bè nào</Text>
            <Text style={styles.emptySubtitle}>
              Tìm kiếm và kết bạn với người khác để bắt đầu trò chuyện
            </Text>
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => router.push('/(tabs)/search' as any)}
              activeOpacity={0.8}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.addFriendButtonText}>Tìm bạn bè</Text>
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
    backgroundColor: '#fff',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#000',
  },
  retry: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  requestBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  separator: {
    height: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});