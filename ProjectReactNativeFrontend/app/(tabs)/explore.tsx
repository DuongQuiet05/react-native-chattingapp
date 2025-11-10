import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
const { width } = Dimensions.get('window');
// Mock data
const stories = [
  { id: 'add', name: 'Add Story', avatar: '' },
  { id: '1', name: 'Gia Monroe', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Jeanne H.', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Kenny Am.', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Laila Gils.', avatar: 'https://i.pravatar.cc/150?img=4' },
];
const posts = [
  {
    id: '1',
    author: 'Kev & Helena',
    avatar: 'https://i.pravatar.cc/150?img=5',
    time: '5h',
    content: 'Take that first step, explore new ideas, and see where it leads. The best time to start is now!',
    likes: 10000,
    comments: 172,
    shares: 80,
    views: 12000,
    commentsCount: 19,
  },
  {
    id: '2',
    author: 'Valerie Azer',
    avatar: 'https://i.pravatar.cc/150?img=6',
    time: '8h',
    content: 'Get your hands dirty and create something beautiful! Discover the art of gunclub making – from shaping clay to adding the final touches.',
    image: 'https://images.unsplash.com/photo-1594608661623-aa0bd7a2610b?w=800',
    likes: 12000,
    comments: 263,
    shares: 78,
    views: 78000,
    commentsCount: 78,
  },
  {
    id: '3',
    author: 'Dhova Juan',
    avatar: 'https://i.pravatar.cc/150?img=7',
    time: '12h',
    content: 'New college, new chapter, new experiences! Embrace the journey, make memories, build friendships, and grow into the best version of yourself.',
    likes: 8000,
    comments: 122,
    shares: 24,
    views: 32000,
    commentsCount: 24,
  },
];
const communities = [
  {
    id: '1',
    name: 'EarthKind Collective',
    description: 'A nurturing community for individuals united in projects that positively impact the planet and...',
    icon: '🌍',
    color: '#4ECDC4',
  },
  {
    id: '2',
    name: 'Commuin Phot',
    description: 'Share great photos, explore connect and give feedback. Perfect...',
    icon: '📸',
    color: '#95E1D3',
  },
];
export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState('For You');
  const isDark = colorScheme === 'dark';
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>COMMUIN</Text>
        <View style={styles.notificationBadge}>
          <IconSymbol name="bell.fill" size={20} color={isDark ? '#fff' : '#000'} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>6</Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
          contentContainerStyle={styles.storiesContent}>
          {stories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyItem}>
              {story.id === 'add' ? (
                <View style={styles.addStoryCircle}>
                  <IconSymbol name="plus" size={24} color="#000" />
                </View>
              ) : (
                <View style={styles.storyCircleWrapper}>
                  <View style={styles.storyCircle}>
                    <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
                  </View>
                </View>
              )}
              <Text style={[styles.storyName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                {story.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['For You', 'Following', 'My Community'].map((tab) => (
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
                  { color: isDark ? '#8E8E93' : '#8E8E93' },
                  activeTab === tab && { color: isDark ? '#fff' : '#000' },
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Posts Feed */}
        {posts.map((post) => (
          <View key={post.id} style={[styles.post, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
              <View style={styles.postHeaderInfo}>
                <Text style={[styles.postAuthor, { color: isDark ? '#fff' : '#000' }]}>
                  {post.author}
                </Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <IconSymbol name="ellipsis" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
            </View>
            {/* Post Content */}
            <Text style={[styles.postContent, { color: isDark ? '#fff' : '#000' }]}>
              {post.content}
            </Text>
            {/* Post Image */}
            {post.image && (
              <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            )}
            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="heart" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                <Text style={styles.actionText}>{formatNumber(post.likes)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="bubble.left" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="arrow.turn.up.right" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                <Text style={styles.actionText}>{post.shares}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="eye" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                <Text style={styles.actionText}>{formatNumber(post.views)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="bubble.right" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                <Text style={styles.actionText}>{post.commentsCount}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {/* Popular Community */}
        <View style={styles.communitySection}>
          <Text style={[styles.communityTitle, { color: isDark ? '#fff' : '#000' }]}>
            Popular Community
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {communities.map((community) => (
              <View
                key={community.id}
                style={[
                  styles.communityCard,
                  { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                ]}>
                <View style={[styles.communityIcon, { backgroundColor: community.color }]}>
                  <Text style={styles.communityEmoji}>{community.icon}</Text>
                </View>
                <Text style={[styles.communityName, { color: isDark ? '#fff' : '#000' }]}>
                  {community.name}
                </Text>
                <Text style={styles.communityDescription} numberOfLines={3}>
                  {community.description}
                </Text>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  }
  return num.toString();
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storiesContainer: {
    marginTop: 12,
  },
  storiesContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  storyCircleWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    borderWidth: 3,
    borderColor: '#E1306C',
    backgroundColor: '#E1306C',
  },
  storyCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
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
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  communitySection: {
    padding: 16,
    marginTop: 8,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  communityCard: {
    width: 200,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityEmoji: {
    fontSize: 28,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});