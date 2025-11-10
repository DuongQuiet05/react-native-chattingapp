import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendFriendRequestModal } from '@/components/send-friend-request-modal';
import type { PostDto } from '@/lib/api/posts';
import { getFeed } from '@/lib/api/posts';
import { searchUsers, type UserSearchResult } from '@/lib/api/friends';
dayjs.extend(relativeTime);
dayjs.locale('vi');
type FilterType = 'Post' | 'Account';
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Account');
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [postResults, setPostResults] = useState<PostDto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string } | null>(null);
  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      setPostResults([]);
      return;
    }
    // Backend requires at least 2 characters
    if (query.trim().length < 2) {
      setUserResults([]);
      setPostResults([]);
      setLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeFilter === 'Account') {
          const results = await searchUsers(query);
          setUserResults(results);
        } else if (activeFilter === 'Post') {
          // Backend doesn't have search endpoint, so we fetch feed and filter client-side
          const searchQuery = query.trim().toLowerCase();
          const feedData = await getFeed(0, 100); // Get more posts to search through
          const filtered = (feedData.content || []).filter((post) =>
            post.content.toLowerCase().includes(searchQuery)
          );
          setPostResults(filtered);
        }
      } catch (error) {setUserResults([]);
        setPostResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms
    return () => clearTimeout(timer);
  }, [query, activeFilter]);
  const handleUserPress = (user: UserSearchResult) => {
    // Navigate to user profile or handle action
    router.push(`/(tabs)/profile/${user.id}` as any);
  };
  const handlePostPress = (post: PostDto) => {
    router.push(`/(tabs)/post-detail?postId=${post.id}` as any);
  };
  const handleSendFriendRequest = (userId: number, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setModalVisible(true);
  };
  const handleModalSuccess = async () => {
    // Refresh search results after sending request
    if (query.trim().length >= 2 && activeFilter === 'Account') {
      setLoading(true);
      try {
        const results = await searchUsers(query);
        setUserResults(results);
      } catch (error) {} finally {
        setLoading(false);
      }
    }
  };
  const renderUserItem = (item: UserSearchResult) => {
    const getActionButton = () => {
      switch (item.relationshipStatus) {
        case 'STRANGER':
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.followButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleSendFriendRequest(item.id, item.displayName || item.username);
              }}>
              <Text style={styles.followButtonText}>Kết bạn</Text>
            </TouchableOpacity>
          );
        case 'FRIEND':
          return (
            <View style={[styles.actionButton, styles.friendButton]}>
              <Text style={styles.friendButtonText}>Bạn bè</Text>
            </View>
          );
        case 'REQUEST_SENT':
          return (
            <View style={[styles.actionButton, styles.disabledButton]}>
              <Text style={styles.disabledButtonText}>Đã gửi</Text>
            </View>
          );
        case 'REQUEST_RECEIVED':
          return (
            <TouchableOpacity
              style={[styles.actionButton, styles.followButton]}
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(tabs)/friend-requests' as any);
              }}>
              <Text style={styles.followButtonText}>Chấp nhận</Text>
            </TouchableOpacity>
          );
        default:
          return null;
      }
    };
    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => handleUserPress(item)}>
        <Image
          source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.displayName}</Text>
          <Text style={styles.itemSubtitle}>@{item.username}</Text>
        </View>
        {getActionButton()}
      </TouchableOpacity>
    );
  };
  const renderPostItem = (item: PostDto) => {
    return (
      <TouchableOpacity style={styles.postContainer} onPress={() => handlePostPress(item)}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.authorAvatar || 'https://i.pravatar.cc/150' }}
            style={styles.postAvatar}
          />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{item.authorName}</Text>
            <Text style={styles.postTime}>{dayjs(item.createdAt).fromNow()}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        <Text style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <View style={styles.postMediaContainer}>
            {item.mediaUrls.slice(0, 2).map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.postMedia} />
            ))}
          </View>
        )}
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.reactionCount || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.commentCount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const renderResults = () => {
    if (loading && query.trim()) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      );
    }
    if (!query.trim()) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Tìm kiếm</Text>
          <Text style={styles.emptySubtitle}>
            Nhập số điện thoại, tên hoặc username để tìm kiếm (tối thiểu 2 ký tự)
          </Text>
        </View>
      );
    }
    if (query.trim().length < 2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={64} color="#ffa500" />
          <Text style={styles.emptyTitle}>Quá ngắn</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng nhập ít nhất 2 ký tự để tìm kiếm (số điện thoại, tên hoặc username)
          </Text>
        </View>
      );
    }
    if (activeFilter === 'Account') {
      if (userResults.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySubtitle}>Thử tìm kiếm với từ khóa khác</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderUserItem(item)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      );
    }
    if (activeFilter === 'Post') {
      if (postResults.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySubtitle}>Thử tìm kiếm với từ khóa khác</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={postResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderPostItem(item)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      );
    }
    return null;
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo số điện thoại, tên, username..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#999"
              autoFocus
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'Post' && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter('Post')}>
            <Text
              style={[
                styles.filterText,
                activeFilter === 'Post' && styles.activeFilterText,
              ]}>
              Bài viết
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'Account' && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter('Account')}>
            <Text
              style={[
                styles.filterText,
                activeFilter === 'Account' && styles.activeFilterText,
              ]}>
              Tài khoản
            </Text>
          </TouchableOpacity>
        </View>
        {/* Results */}
        {renderResults()}
        {/* Send Friend Request Modal */}
        {selectedUser && (
          <SendFriendRequestModal
            visible={modalVisible}
            recipientId={selectedUser.id}
            recipientName={selectedUser.name}
            onClose={() => {
              setModalVisible(false);
              setSelectedUser(null);
            }}
            onSuccess={handleModalSuccess}
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
    backgroundColor: '#f5f5f5',
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
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
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
    color: '#000',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
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
    color: '#000',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#000',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendButton: {
    backgroundColor: '#f0f0f0',
  },
  friendButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginLeft: 76,
  },
  // Post styles
  postContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  postAuthorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  postTime: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
    marginBottom: 12,
  },
  postMediaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  postMedia: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
});