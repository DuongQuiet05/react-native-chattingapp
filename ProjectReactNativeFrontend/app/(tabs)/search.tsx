import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SectionList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useConversations } from '@/hooks/api/use-conversations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationSummary } from '@/lib/api/conversations';
import { searchUsers, type UserSearchResult } from '@/lib/api/friends';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface SearchSection {
  title: string;
  data: (UserSearchResult | ConversationSummary)[];
  type: 'users' | 'conversations';
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const { data: conversations } = useConversations();

  // Filter conversations based on query
  const conversationResults = conversations?.filter((conv) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return conv.title?.toLowerCase().includes(q);
  }) || [];

  // Debounced search for users
  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    // Backend requires at least 2 characters
    if (query.trim().length < 2) {
      setUserResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchUsers(query);
        setUserResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setUserResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [query]);

  // Create sections for SectionList
  const sections: SearchSection[] = [];
  
  if (conversationResults.length > 0) {
    sections.push({
      title: 'Cuộc trò chuyện',
      data: conversationResults,
      type: 'conversations',
    });
  }

  if (userResults.length > 0) {
    sections.push({
      title: 'Người dùng',
      data: userResults,
      type: 'users',
    });
  }

  const handleConversationPress = (conversation: ConversationSummary) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleUserPress = (user: UserSearchResult) => {
    if (user.relationshipStatus === 'FRIEND') {
      // TODO: Create or navigate to conversation with this friend
      Alert.alert(
        'Nhắn tin',
        `Bắt đầu cuộc trò chuyện với ${user.displayName}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Nhắn tin',
            onPress: () => {
              // TODO: Implement create/navigate to conversation
              console.log('Start conversation with:', user.id);
            },
          },
        ]
      );
    } else if (user.relationshipStatus === 'STRANGER') {
      Alert.alert(
        'Thêm bạn bè',
        `Gửi lời mời kết bạn đến ${user.displayName}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Gửi lời mời',
            onPress: () => {
              // Navigate to search-users screen which has the send request modal
              router.push('/(tabs)/search-users' as any);
            },
          },
        ]
      );
    } else if (user.relationshipStatus === 'REQUEST_RECEIVED') {
      Alert.alert(
        'Lời mời kết bạn',
        `${user.displayName} đã gửi lời mời kết bạn đến bạn`,
        [
          { text: 'Xem sau', style: 'cancel' },
          {
            text: 'Xem lời mời',
            onPress: () => {
              router.push('/(tabs)/friend-requests' as any);
            },
          },
        ]
      );
    } else if (user.relationshipStatus === 'REQUEST_SENT') {
      Alert.alert(
        'Đã gửi lời mời',
        `Bạn đã gửi lời mời kết bạn đến ${user.displayName}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderConversationItem = (item: ConversationSummary) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleConversationPress(item)}>
      <Image
        source={
          item.avatarUrl
            ? { uri: item.avatarUrl }
            : require('@/assets/images/icon.png')
        }
        style={styles.avatar}
      />
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
        {item.lastMessagePreview && (
          <ThemedText style={styles.itemSubtitle} numberOfLines={1}>
            {item.lastMessagePreview}
          </ThemedText>
        )}
        {item.lastMessageAt && (
          <ThemedText style={styles.itemTime}>
            {dayjs(item.lastMessageAt).fromNow()}
          </ThemedText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderUserItem = (item: UserSearchResult) => {
    const renderActionButton = () => {
      switch (item.relationshipStatus) {
        case 'STRANGER':
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleUserPress(item);
              }}>
              <ThemedText style={styles.actionButtonText}>Kết bạn</ThemedText>
            </TouchableOpacity>
          );

        case 'FRIEND':
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleUserPress(item);
              }}>
              <ThemedText style={styles.actionButtonText}>Nhắn tin</ThemedText>
            </TouchableOpacity>
          );

        case 'REQUEST_SENT':
          return (
            <View style={[styles.actionButton, styles.disabledButton]}>
              <ThemedText style={styles.disabledButtonText}>Đã gửi</ThemedText>
            </View>
          );

        case 'REQUEST_RECEIVED':
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleUserPress(item);
              }}>
              <ThemedText style={styles.actionButtonText}>Chấp nhận</ThemedText>
            </TouchableOpacity>
          );

        default:
          return null;
      }
    };

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleUserPress(item)}>
        <Image
          source={
            item.avatarUrl
              ? { uri: item.avatarUrl }
              : require('@/assets/images/icon.png')
          }
          style={styles.avatar}
        />
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemTitle}>{item.displayName}</ThemedText>
          <ThemedText style={styles.itemSubtitle}>@{item.username}</ThemedText>
          {item.phoneNumber && (
            <ThemedText style={styles.itemPhone}>📱 {item.phoneNumber}</ThemedText>
          )}
          {item.mutualFriendsCount > 0 && (
            <ThemedText style={styles.mutualFriends}>
              {item.mutualFriendsCount} bạn chung
            </ThemedText>
          )}
        </View>
        {renderActionButton()}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, section }: { item: any; section: SearchSection }) => {
    if (section.type === 'conversations') {
      return renderConversationItem(item as ConversationSummary);
    }
    return renderUserItem(item as UserSearchResult);
  };

  const renderSectionHeader = ({ section }: { section: SearchSection }) => (
    <ThemedView style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0a84ff" />
          </TouchableOpacity>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' },
            ]}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { color: colorScheme === 'dark' ? '#fff' : '#000' },
              ]}
              placeholder="Tìm người dùng (SĐT/Username) hoặc tin nhắn..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#999"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {loading && query.trim() ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Đang tìm kiếm...</ThemedText>
          </View>
        ) : !query.trim() ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>Tìm kiếm</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Nhập ít nhất 2 ký tự để tìm kiếm
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
              💡 Có thể tìm theo: Số điện thoại, Username, Tên hiển thị
            </ThemedText>
          </View>
        ) : query.trim().length < 2 ? (
          <View style={styles.emptyState}>
            <Ionicons name="information-circle-outline" size={64} color="#ffa500" />
            <ThemedText style={styles.emptyTitle}>Quá ngắn</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Vui lòng nhập ít nhất 2 ký tự để tìm kiếm
            </ThemedText>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>Không tìm thấy kết quả</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Thử tìm kiếm với từ khóa khác
            </ThemedText>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item: any, index) => 
              'id' in item ? `${item.id}-${index}` : `user-${item.username}-${index}`
            }
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemPhone: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  mutualFriends: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginLeft: 76, // Align with text (48px avatar + 12px gap + 16px padding)
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0a84ff',
  },
  successButton: {
    backgroundColor: '#34c759',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});
