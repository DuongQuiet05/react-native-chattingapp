import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePost, useDeletePost, useReactToPost, useRemovePostReaction } from '@/hooks/api/use-posts';
import { usePostComments, useCreateComment, useDeleteComment } from '@/hooks/api/use-comments';
import { router, useLocalSearchParams } from 'expo-router';
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
function CommentItem({ comment }: { comment: any }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };
  return (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: comment.authorAvatar || 'https://i.pravatar.cc/150' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>@{comment.authorName}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => setIsLiked(!isLiked)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={isLiked ? '#FF3040' : '#666666'}
            />
            {likeCount > 0 && (
              <Text style={styles.commentLikeCount}>{formatNumber(likeCount)}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.replyButton}>
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { data: post, isLoading, refetch } = usePost(Number(postId));
  const { data: commentsData, refetch: refetchComments } = usePostComments(Number(postId));
  const createComment = useCreateComment();
  const deletePost = useDeletePost();
  const reactToPost = useReactToPost();
  const removeReaction = useRemovePostReaction();
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const comments = commentsData?.comments || [];
  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  // Check if post has video (only when post is loaded)
  const hasVideo = post ? post.mediaUrls?.some((url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('/video/upload/') || 
           lowerUrl.includes('/video/') ||
           ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'].some(ext => lowerUrl.includes(ext));
  }) : false;
  useFocusEffect(
    React.useCallback(() => {
      // Start playing video when screen is focused and post has video
      if (post && hasVideo) {
        // Small delay to ensure component is mounted
        const timer = setTimeout(() => {
          setShouldPlayVideo(true);
        }, 300);
        return () => {
          clearTimeout(timer);
          setShouldPlayVideo(false);
        };
      }
      return () => {
        setShouldPlayVideo(false);
      };
    }, [post, hasVideo])
  );
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };
  const handleReaction = async (reactionType: string) => {
    if (post?.userReaction === reactionType) {
      await removeReaction.mutateAsync(Number(postId));
    } else {
      await reactToPost.mutateAsync({ postId: Number(postId), reaction: { reactionType } });
    }
    setShowReactions(false);
  };
  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment.mutateAsync({ postId: Number(postId), content: commentText });
      setCommentText('');
      refetchComments();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bình luận');
    }
  };
  const handleDeletePost = () => {
    Alert.alert('Xóa bài viết', 'Bạn có chắc chắn muốn xóa bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost.mutateAsync(Number(postId));
            router.back();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa bài viết');
          }
        },
      },
    ]);
  };
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleDeletePost}>
            <Ionicons name="ellipsis-vertical" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
          {/* Post Container */}
          <View style={styles.postContainer}>
            {/* Post Media Carousel */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <View style={styles.postMediaContainer}>
                <PostMediaCarousel
                  mediaUrls={post.mediaUrls}
                  imageWidth={width}
                  imageHeight={width * 0.75}
                  autoPlay={hasVideo} // Enable auto-play for videos
                  shouldPlay={shouldPlayVideo && hasVideo} // Play when screen is focused
                  useNativeControls={hasVideo} // Use native controls for better UX in post-detail
                  isMuted={false} // Unmuted in post-detail
                />
              </View>
            )}
            {/* Engagement Metrics */}
            <View style={styles.engagementMetrics}>
              <TouchableOpacity
                style={styles.metricItem}
                onPress={() => {
                  if (post.userReaction) {
                    handleReaction(post.userReaction);
                  } else {
                    setShowReactions(!showReactions);
                  }
                }}
                onLongPress={() => setShowReactions(true)}>
                <Ionicons
                  name={post.userReaction ? 'heart' : 'heart-outline'}
                  size={20}
                  color={post.userReaction ? '#FF3040' : '#666666'}
                />
                <Text style={styles.metricCount}>{formatNumber(post.reactionCount || 0)}</Text>
              </TouchableOpacity>
              <View style={styles.metricItem}>
                <Ionicons name="chatbubble-outline" size={20} color="#666666" />
                <Text style={styles.metricCount}>{formatNumber(post.commentCount || 0)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="paper-plane-outline" size={20} color="#666666" />
                <Text style={styles.metricCount}>{formatNumber(post.shareCount || 0)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="repeat-outline" size={20} color="#666666" />
                <Text style={styles.metricCount}>{formatNumber(post.repostCount || 0)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="bookmark-outline" size={20} color="#666666" />
                <Text style={styles.metricCount}>{formatNumber(post.bookmarkCount || 0)}</Text>
              </View>
            </View>
            {showReactions && (
              <View style={styles.reactionsPicker}>
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
            {/* Post Title */}
            <Text style={styles.postTitle}>
              {post.content.length > 60 
                ? post.content.substring(0, 60) + '...' 
                : post.content}
            </Text>
            {/* Post Description */}
            <Text style={styles.postDescription}>
              {post.content.length > 60 
                ? post.content.substring(60) 
                : 'Get your hands dirty and create something beautiful! Discover the art of gerabah making — from shaping clay to adding the final touches.'}
            </Text>
            {/* Post Date */}
            <Text style={styles.postDate}>
              {dayjs(post.createdAt).format('D MMMM YYYY')}
            </Text>
          </View>
          {/* Comments Section */}
          <View style={styles.commentsSection}>
            {displayedComments.length > 0 ? (
              <>
                {displayedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
                {comments.length > 3 && !showAllComments && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowAllComments(true)}>
                    <Text style={styles.viewAllText}>View All Comments</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.noComments}>No comments yet</Text>
            )}
          </View>
        </ScrollView>
        {/* Add Comment Input */}
        <View style={styles.addCommentContainer}>
          <Image
            source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/150' }}
            style={styles.userAvatar}
          />
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add Comments"
              placeholderTextColor="#999999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              onSubmitEditing={handleComment}
            />
            {commentText.trim() && (
              <TouchableOpacity onPress={handleComment} style={styles.sendButton}>
                <Ionicons name="send" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#E8F4FD',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    marginBottom: Spacing.md,
    color: '#000000',
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: Spacing.md,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  postMediaContainer: {
    width: '100%',
    backgroundColor: '#F0F0F0',
  },
  engagementMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  reactionsPicker: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reactionOption: {
    padding: Spacing.xs,
  },
  reactionEmojiLarge: {
    fontSize: 32,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postDate: {
    fontSize: 13,
    color: '#999999',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  commentsSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeCount: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  replyButton: {
    paddingVertical: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  viewAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  noComments: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: Spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: Spacing.xs,
    maxHeight: 100,
  },
  sendButton: {
    padding: Spacing.xs,
  },
});