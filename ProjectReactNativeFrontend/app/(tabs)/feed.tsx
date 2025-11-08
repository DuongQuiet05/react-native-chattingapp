import React, { useState, useRef, useCallback } from 'react';
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
  FlatList,
  ViewToken,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { useFeed, useReactToPost, useRemovePostReaction } from '@/hooks/api/use-posts';
import { useContacts } from '@/hooks/api/use-contacts';
import { useUnreadCount } from '@/hooks/api/use-notifications';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '@/contexts/auth-context';
import { PostMediaCarousel } from '@/components/post-media-carousel';
import { useFocusEffect } from '@react-navigation/native';

dayjs.extend(relativeTime);

const { width } = Dimensions.get('window');

const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};

const GRADIENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

// Mock communities - có thể thay bằng API sau
const communities = [
  {
    id: '1',
    name: 'EarthKind Collective',
    description: 'A community of conscious individuals united to protect, preserve, and restore the planet for future generations.',
    icon: '🌍',
    color: '#87CEEB',
    members: 5000,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
    ],
  },
  {
    id: '2',
    name: 'Commuin Photo',
    description: 'Where good energy people connect deeply through authenticity, meaningful conversations, and shared experiences.',
    icon: '📷',
    color: '#87CEEB',
    members: 3200,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
    ],
  },
];

function StoryItem({ story, isFirst }: { story: any; isFirst: boolean }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isFirst) {
    return (
      <TouchableOpacity style={styles.storyItem}>
        <View style={styles.addStoryCircle}>
          <Ionicons name="add" size={20} color="#666666" />
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          Add Story
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.storyItem}>
      <View style={styles.storyCircleWrapper}>
        <View style={[styles.storyCircle, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: story.avatarUrl || 'https://i.pravatar.cc/150' }}
            style={styles.storyAvatar}
          />
        </View>
      </View>
      <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
        {story.displayName || story.username}
      </Text>
    </TouchableOpacity>
  );
}

function StoriesSection() {
  const { data: friends } = useContacts();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const stories = friends?.slice(0, 8) || [];

  return (
    <View style={styles.storiesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}>
        <StoryItem story={{}} isFirst={true} />
        {stories.map((friend) => (
          <StoryItem key={friend.id} story={friend} isFirst={false} />
        ))}
      </ScrollView>
    </View>
  );
}

interface PostCardProps {
  post: any;
  isVisible?: boolean; // Whether this post is currently visible on screen
}

function PostCard({ post, isVisible = false }: PostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const reactToPost = useReactToPost();
  const removeReaction = useRemovePostReaction();
  const [showReactions, setShowReactions] = useState(false);

  // Check if post has video
  const hasVideo = post.mediaUrls?.some((url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('/video/upload/') || 
           lowerUrl.includes('/video/') ||
           ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'].some(ext => lowerUrl.includes(ext));
  });

  const handleReaction = async (reactionType: string) => {
    if (post.userReaction === reactionType) {
      await removeReaction.mutateAsync(post.id);
    } else {
      await reactToPost.mutateAsync({ postId: post.id, reaction: { reactionType } });
    }
    setShowReactions(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthor}
          onPress={() => router.push(`/(tabs)/profile/${post.authorId}` as any)}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: post.authorAvatar || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.text }]}>{post.authorName}</Text>
            <View style={styles.postMeta}>
              <Text style={[styles.postTime, { color: colors.textSecondary }]}>
                {dayjs(post.createdAt).fromNow()}
              </Text>
              {post.privacyType && (
                <>
                  <Text style={[styles.postTime, { color: colors.textSecondary }]}> • </Text>
                  <IconSymbol
                    name={post.privacyType === 'PUBLIC' ? 'globe' : 'lock.fill'}
                    size={12}
                    color={colors.textSecondary}
                  />
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <TouchableOpacity onPress={() => router.push(`/(tabs)/post-detail?postId=${post.id}` as any)}>
        <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={5}>
          {post.content}
        </Text>
      </TouchableOpacity>

      {/* Post Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            // Pause video before navigating to post-detail
            router.push(`/(tabs)/post-detail?postId=${post.id}` as any);
          }}
          style={styles.mediaContainer}
          activeOpacity={1}
          delayPressIn={100}>
          <PostMediaCarousel
            mediaUrls={post.mediaUrls}
            imageWidth={width - Spacing.md * 4}
            imageHeight={300}
            autoPlay={hasVideo} // Enable auto-play for posts with video
            shouldPlay={isVisible && hasVideo} // Play only when visible and has video
            isMuted={true} // Muted by default in feed (like Instagram/TikTok)
            showMuteButton={hasVideo} // Show mute/unmute button for videos
          />
        </TouchableOpacity>
      )}

      {/* Location */}
      {post.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color={colors.textSecondary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>{post.location}</Text>
        </View>
      )}

      {/* Post Stats */}
      {(post.reactionCount > 0 || post.commentCount > 0) && (
        <View style={styles.postStats}>
          {post.reactionCount > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.reactionsPreview}>
                {post.userReaction && (
                  <Text style={styles.reactionEmoji}>
                    {REACTION_EMOJIS[post.userReaction as keyof typeof REACTION_EMOJIS]}
                  </Text>
                )}
              </View>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                {formatNumber(post.reactionCount)}
              </Text>
            </View>
          )}
          {post.commentCount > 0 && (
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              {formatNumber(post.commentCount)} bình luận
            </Text>
          )}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.reactionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (post.userReaction) {
                handleReaction(post.userReaction);
              } else {
                setShowReactions(!showReactions);
              }
            }}
            onLongPress={() => setShowReactions(true)}>
            <Ionicons 
              name={post.userReaction ? "heart" : "heart-outline"} 
              size={20} 
              color={post.userReaction ? '#FF3040' : '#666666'} 
            />
            <Text style={styles.actionCount}>{formatNumber(post.reactionCount || 0)}</Text>
          </TouchableOpacity>

          {showReactions && (
            <View style={[styles.reactionsPicker, { backgroundColor: colors.card }, Shadows.lg]}>
              {REACTION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.reactionOption}
                  onPress={() => handleReaction(type)}>
                  <Text style={styles.reactionEmojiLarge}>{REACTION_EMOJIS[type]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/(tabs)/post-detail?postId=${post.id}` as any)}>
          <Ionicons name="chatbubble-outline" size={20} color="#666666" />
          <Text style={styles.actionCount}>{formatNumber(post.commentCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={20} color="#666666" />
          <Text style={styles.actionCount}>{formatNumber(post.shareCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="repeat-outline" size={20} color="#666666" />
          <Text style={styles.actionCount}>{formatNumber(post.repostCount || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#666666" />
          <Text style={styles.actionCount}>{formatNumber(post.bookmarkCount || 0)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CommunitiesSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `+${(count / 1000).toFixed(1)}K`;
    }
    return `+${count}`;
  };

  return (
    <View style={styles.communitySection}>
      <View style={styles.communityHeader}>
        <Text style={styles.communityTitle}>Popular Community</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communityScroll}>
        {communities.map((community) => (
          <View key={community.id} style={styles.communityCard}>
            <View style={[styles.communityIcon, { backgroundColor: community.color }]}>
              <Text style={styles.communityEmoji}>{community.icon}</Text>
            </View>
            <Text style={styles.communityName} numberOfLines={1}>
              {community.name}
            </Text>
            <Text style={styles.communityDescription} numberOfLines={2}>
              {community.description}
            </Text>
            {community.memberAvatars && (
              <View style={styles.membersOverlay}>
                {community.memberAvatars.slice(0, 3).map((avatar, index) => (
                  <Image
                    key={index}
                    source={{ uri: avatar }}
                    style={[styles.memberAvatar, { left: index * 20 }]}
                  />
                ))}
                <View style={[styles.memberCountBadge, { left: community.memberAvatars.length * 20 }]}>
                  <Text style={styles.memberCountText}>{formatMembers(community.members)}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => {}}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'For You' | 'Following' | 'My Community'>('For You');
  const [page, setPage] = useState(0);
  const { data, isLoading, isRefetching, refetch } = useFeed(page, 20);
  const { data: unreadCount } = useUnreadCount();
  const [visiblePostIds, setVisiblePostIds] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  const handleRefresh = () => {
    refetch();
  };

  const handleCreatePost = () => {
    router.push('/(tabs)/create-post' as any);
  };

  const tabs = ['For You', 'Following', 'My Community'] as const;

  // Track visible posts for auto-play video
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIds = new Set<number>();
    viewableItems.forEach((item) => {
      if (item.item?.id) {
        visibleIds.add(item.item.id);
      }
    });
    setVisiblePostIds(visibleIds);
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Post is considered visible when 50% is on screen
  }).current;

  // Pause all videos when screen loses focus (user navigates away or switches tabs)
  useFocusEffect(
    useCallback(() => {
      // When screen gains focus, do nothing (videos will auto-play based on visibility)
      return () => {
        // When screen loses focus (blur), pause all videos by clearing visible posts
        setVisiblePostIds(new Set());
      };
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>COMMUIN</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications' as any)}>
            <Ionicons name="notifications" size={22} color="#000000" />
            {unreadCount && unreadCount.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount.count > 99 ? '99+' : unreadCount.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBarContainer}
        onPress={() => router.push('/(tabs)/search' as any)}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search...</Text>
        </View>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
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
              {tab === 'For You' ? 'For You' : tab === 'Following' ? 'Following' : 'My Community'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {isLoading && page === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : data?.content && data.content.length > 0 ? (
        <FlatList
          ref={flatListRef}
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          data={[
            { type: 'stories', id: 'stories' } as any,
            ...(activeTab === 'My Community' ? [{ type: 'communities', id: 'communities' } as any] : []),
            ...data.content
              .filter((post) => !post.isHidden)
              .map((post) => ({ type: 'post', ...post } as any)),
            ...(activeTab === 'My Community' ? [{ type: 'communities-bottom', id: 'communities-bottom' } as any] : []),
          ]}
          keyExtractor={(item: any) => {
            if (item.type === 'stories') return 'stories';
            if (item.type === 'communities') return 'communities';
            if (item.type === 'communities-bottom') return 'communities-bottom';
            return `post-${item.id}`;
          }}
          renderItem={({ item }: { item: any }) => {
            if (item.type === 'stories') {
              return <StoriesSection />;
            }
            if (item.type === 'communities' || item.type === 'communities-bottom') {
              return <CommunitiesSection />;
            }
            if (item.type === 'post') {
              return (
                <PostCard 
                  post={item} 
                  isVisible={visiblePostIds.has(item.id)}
                />
              );
            }
            return null;
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="photo" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Chưa có bài viết nào
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={handleCreatePost}>
                <Text style={styles.emptyButtonText}>Tạo bài viết đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol name="photo" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Chưa có bài viết nào
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={handleCreatePost}>
            <Text style={styles.emptyButtonText}>Tạo bài viết đầu tiên</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  createButton: {
    padding: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stories
  storiesContainer: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  storiesContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
  },
  storyCircleWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#E1306C',
  },
  storyCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    color: '#000000',
  },
  // Post Card
  postCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  authorInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  postTime: {
    fontSize: 13,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  mediaContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  postImage: {
    width: width - Spacing.md * 4,
    height: 300,
    borderRadius: BorderRadius.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: 13,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionsPreview: {
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 14,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  reactionContainer: {
    position: 'relative',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  reactionsPicker: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    zIndex: 10,
  },
  reactionOption: {
    padding: Spacing.xs,
  },
  reactionEmojiLarge: {
    fontSize: 32,
  },
  // Communities
  communitySection: {
    marginVertical: Spacing.lg,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  communityScroll: {
    paddingLeft: Spacing.md,
  },
  communityCard: {
    width: 280,
    padding: Spacing.md,
    borderRadius: 16,
    marginRight: Spacing.md,
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
    position: 'relative',
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  communityEmoji: {
    fontSize: 28,
  },
  communityName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    color: '#000000',
  },
  communityDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
    color: '#666666',
  },
  membersOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    height: 32,
    position: 'relative',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  memberCountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'absolute',
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  joinButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Search Bar
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#999999',
  },
});
