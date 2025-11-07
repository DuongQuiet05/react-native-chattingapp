import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/api/use-profile';
import { useUserPosts } from '@/hooks/api/use-posts';
import { searchUsers, type RelationshipStatus, getFriendsList, type FriendProfile } from '@/lib/api/friends';
import { SendFriendRequestModal } from '@/components/send-friend-request-modal';
import { useCheckBlocked, useBlockUser, useUnblockUser } from '@/hooks/api/use-blocks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width } = Dimensions.get('window');

function PostCard({ post }: { post: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthor}
          onPress={() => router.push(`/(tabs)/profile/${post.authorId}` as any)}>
          <Image
            source={{ uri: post.authorAvatar || 'https://i.pravatar.cc/150' }}
            style={styles.postAvatar}
          />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{post.authorName}</Text>
            <Text style={styles.postTime}>{dayjs(post.createdAt).fromNow()}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.postContent} numberOfLines={5}>
        {post.content}
      </Text>
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.postMediaContainer}>
          {post.mediaUrls.slice(0, 2).map((url: string, index: number) => (
            <Image key={index} source={{ uri: url }} style={styles.postMedia} />
          ))}
        </View>
      )}
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(post.reactionCount || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(post.commentCount || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="paper-plane-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(post.shareCount || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(post.repostCount || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="bookmark-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatNumber(post.bookmarkCount || 0)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const userIdNum = parseInt(userId || '0', 10);
  const isOwnProfile = currentUser?.id === userIdNum;
  
  const { data: profile, isLoading, refetch } = useUserProfile(userIdNum);
  const { data: postsData } = useUserPosts(userIdNum);
  
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | null>(null);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
  const [mutualFriends, setMutualFriends] = useState<FriendProfile[]>([]);
  const [loadingRelationship, setLoadingRelationship] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Activity' | 'Post' | 'Tagged' | 'Media'>('Activity');

  // Block functionality
  const { data: checkBlockedData } = useCheckBlocked(userIdNum);
  const isBlocked = checkBlockedData?.isBlocked || false;
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  // Load relationship status and mutual friends
  useEffect(() => {
    if (!isOwnProfile && profile?.username && currentUser?.id) {
      setLoadingRelationship(true);
      searchUsers(profile.username)
        .then((searchResults) => {
          const userResult = searchResults.find((u) => u.id === userIdNum);
          if (userResult) {
            setRelationshipStatus(userResult.relationshipStatus);
            setMutualFriendsCount(userResult.mutualFriendsCount);
            
            // Load mutual friends list if there are mutual friends
            if (userResult.mutualFriendsCount > 0) {
              getFriendsList()
                .then((currentUserFriends) => {
                  // Show first few friends as mutual friends (simplified)
                  // In a real app, you'd need an API endpoint to get mutual friends list
                  setMutualFriends(currentUserFriends.slice(0, Math.min(10, userResult.mutualFriendsCount)));
                })
                .catch((error) => {
                  console.warn('Could not load friends list:', error);
                  // Continue without mutual friends list
                });
            }
          }
        })
        .catch((error) => {
          console.error('Error loading relationship:', error);
        })
        .finally(() => {
          setLoadingRelationship(false);
        });
    }
  }, [profile?.username, userIdNum, isOwnProfile, currentUser?.id]);

  const handleSendFriendRequest = () => {
    if (profile) {
      setModalVisible(true);
    }
  };

  const handleModalSuccess = async () => {
    setModalVisible(false);
    // Refresh relationship status
    if (profile?.username) {
      const results = await searchUsers(profile.username);
      const userResult = results.find((u) => u.id === userIdNum);
      if (userResult) {
        setRelationshipStatus(userResult.relationshipStatus);
      }
    }
  };

  const handleBlock = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Chặn người dùng',
      `Bạn có chắc chắn muốn chặn ${profile?.displayName || profile?.username}? Người này sẽ không thể nhắn tin hoặc xem nội dung của bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUserMutation.mutateAsync(userIdNum);
              Alert.alert('Thành công', 'Đã chặn người dùng');
              router.back();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể chặn người dùng');
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Bỏ chặn người dùng',
      `Bạn có chắc chắn muốn bỏ chặn ${profile?.displayName || profile?.username}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ chặn',
          onPress: async () => {
            try {
              await unblockUserMutation.mutateAsync(userIdNum);
              Alert.alert('Thành công', 'Đã bỏ chặn người dùng');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể bỏ chặn người dùng');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    setMenuVisible(false);
    Alert.alert('Báo cáo', 'Tính năng báo cáo sẽ được triển khai trong tương lai');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push('/(tabs)/settings' as any)}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loadingRelationship) {
      return (
        <View style={styles.actionButtons}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.actionButtons}>
        {isBlocked ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.unblockButton]}
            onPress={handleUnblock}>
            <Text style={styles.unblockButtonText}>Bỏ chặn</Text>
          </TouchableOpacity>
        ) : (
          <>
            {relationshipStatus === 'FRIEND' ? (
              <View style={[styles.actionButton, styles.friendButton]}>
                <Text style={styles.friendButtonText}>Bạn bè</Text>
              </View>
            ) : relationshipStatus === 'REQUEST_SENT' ? (
              <View style={[styles.actionButton, styles.disabledButton]}>
                <Text style={styles.disabledButtonText}>Đã gửi</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.followButton]}
                onPress={handleSendFriendRequest}>
                <Text style={styles.followButtonText}>Kết bạn</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => router.push(`/chat/${userIdNum}` as any)}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const postCount = postsData?.content?.length || 0;
  const followersCount = 0; // TODO: Get from API
  const followingCount = 0; // TODO: Get from API

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F5F5F5' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        {!isOwnProfile && (
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {isOwnProfile && <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar and Stats Row */}
          <View style={styles.profileHeaderRow}>
            <Image
              source={{ uri: profile.avatarUrl || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{postCount}</Text>
                <Text style={styles.statLabel}>Post</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(followersCount)}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(followingCount)}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Name and Bio */}
          <Text style={styles.name}>{profile.displayName}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Action Buttons */}
          {renderActionButtons()}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['Activity', 'Post', 'Tagged', 'Media'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mutual Friends Section */}
        {!isOwnProfile && mutualFriendsCount > 0 && (
          <View style={styles.mutualFriendsCard}>
            <View style={styles.mutualFriendsHeader}>
              <Text style={styles.mutualFriendsTitle}>Mutual Friends</Text>
              <TouchableOpacity>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mutualFriendsList}>
              {mutualFriends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.mutualFriendItem}
                  onPress={() => router.push(`/(tabs)/profile/${friend.id}` as any)}>
                  <Image
                    source={{ uri: friend.avatarUrl || 'https://i.pravatar.cc/150' }}
                    style={styles.mutualFriendAvatar}
                  />
                  <Text style={styles.mutualFriendName} numberOfLines={1}>
                    {friend.displayName || friend.username}
                  </Text>
                  <Text style={styles.mutualFriendUsername} numberOfLines={1}>
                    @{friend.username}
                  </Text>
                  <TouchableOpacity style={styles.followButtonSmall}>
                    <Text style={styles.followButtonSmallText}>Follow</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Posts Feed */}
        {activeTab === 'Activity' && postsData?.content && postsData.content.length > 0 && (
          <View style={styles.postsContainer}>
            {postsData.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Send Friend Request Modal */}
      {profile && (
        <SendFriendRequestModal
          visible={modalVisible}
          recipientId={profile.id}
          recipientName={profile.displayName || profile.username}
          onClose={() => setModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBlock}>
              <Ionicons name="ban" size={24} color="#ff3b30" />
              <Text style={styles.menuItemText}>Chặn người dùng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReport}>
              <Ionicons name="flag" size={24} color="#ff9500" />
              <Text style={styles.menuItemText}>Báo cáo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuItemCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backLink: {
    color: '#0a84ff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: Spacing.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: Spacing.md,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: Spacing.xs,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
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
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
  },
  messageButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  mutualFriendsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: Spacing.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  mutualFriendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mutualFriendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  mutualFriendsList: {
    marginTop: Spacing.sm,
  },
  mutualFriendItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 100,
  },
  mutualFriendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Spacing.xs,
  },
  mutualFriendName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 2,
  },
  mutualFriendUsername: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  followButtonSmall: {
    backgroundColor: '#000',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    width: '100%',
  },
  followButtonSmallText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  postsContainer: {
    padding: Spacing.md,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  postAuthorInfo: {
    flex: 1,
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
    marginBottom: Spacing.sm,
  },
  postMediaContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  postMedia: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  postStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
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
  unblockButton: {
    backgroundColor: '#ff3b30',
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  menuItemCancel: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
  },
  menuItemCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
    textAlign: 'center',
  },
});
