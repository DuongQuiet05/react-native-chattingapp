import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function StoriesList() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [friends, setFriends] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    setLoading(true);
    
    // Import dynamically locally to avoid circular dependencies if any
    import('@/lib/api/friends').then(({ getFriendsList }) => {
      return getFriendsList();
    })
    .then((friendsList) => {
      if (Array.isArray(friendsList)) {
        setFriends(friendsList.slice(0, 10));
      } else {
        setFriends([]);
      }
    })
    .catch((error) => {
      console.error('[Stories] Error loading friends:', error);
      setFriends([]);
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.storiesContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Hide if no friends loaded and not loading
  // But we usually want to show the "Add Story" button at least
  // So we always return the view

  return (
    <View style={styles.storiesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}>
        {/* Add Story Button */}
        <TouchableOpacity
          style={styles.storyCard}
          onPress={() => router.push('/stories/create')}>
          <View style={styles.addStoryCard}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
            <Text style={styles.addStoryText}>Tạo Story</Text>
          </View>
        </TouchableOpacity>
        
        {/* Friends Stories */}
        {friends.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.storyCard}
            onPress={() => router.push(`/stories/${friend.id}`)}>
            <Image
              source={{ uri: friend.avatarUrl || 'https://i.pravatar.cc/150' }}
              style={styles.storyThumbnail}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <View style={styles.storyGradient} />
            {/* User Info at Bottom */}
            <View style={styles.storyUserInfo}>
              <Image
                source={{ uri: friend.avatarUrl || 'https://i.pravatar.cc/150' }}
                style={styles.storyUserAvatar}
              />
              <Text style={styles.storyUsername} numberOfLines={1}>
                {friend.displayName || friend.username}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  storiesContainer: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
    minHeight: 200, // Ensure height for loading state
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesContent: {
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  storyCard: {
    width: 120,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  addStoryCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
    borderRadius: 12,
  },
  addStoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  storyThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  storyGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  storyUserInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
