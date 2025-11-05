import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, ScrollView, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConversationListItem } from '@/components/conversation-list-item';
import { CreateChatModal } from '@/components/create-chat-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { conversationQueryKeys, useConversations } from '@/hooks/api/use-conversations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationSummary } from '@/lib/api/conversations';
import { useStomp } from '@/providers/stomp-provider';
import { getFriendsList, type FriendProfile } from '@/lib/api/friends';

export default function ChatsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { connected, subscribe } = useStomp();
  const colorScheme = useColorScheme();
  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useConversations();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [createChatModalVisible, setCreateChatModalVisible] = useState(false);

  const handlePressConversation = useCallback(
    (conversationId: number) => {
      router.push(`/chat/${conversationId}`);
    },
    [router],
  );

  const handleCreateChatSuccess = useCallback(
    (conversationId: number) => {
      setCreateChatModalVisible(false);
      router.push(`/chat/${conversationId}`);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
      // Load friends for stories
      setLoadingFriends(true);
      getFriendsList()
        .then((friendsList) => {
          // Handle empty list gracefully
          if (Array.isArray(friendsList)) {
            setFriends(friendsList.slice(0, 10)); // Get first 10 friends for stories
          } else {
            setFriends([]);
          }
        })
        .catch((error) => {
          console.warn('Could not load friends:', error);
          // Don't show alert, just set empty array
          setFriends([]);
        })
        .finally(() => {
          setLoadingFriends(false);
        });
    }, [refetch]),
  );

  useEffect(() => {
    if (!connected) {
      return;
    }

    const unsubscribe = subscribe('/user/queue/conversations', (message) => {
      try {
        const payload = JSON.parse(message.body) as ConversationSummary;

        queryClient.setQueryData<ConversationSummary[] | undefined>(
          conversationQueryKeys.all,
          (previous) => {
            if (!previous) {
              return [payload];
            }

            const index = previous.findIndex((item) => item.id === payload.id);
            if (index === -1) {
              return [payload, ...previous];
            }

            const copy = [...previous];
            copy[index] = { ...copy[index], ...payload };
            return copy;
          },
        );
      } catch (error) {
        console.warn('Không thể phân tích dữ liệu conversation realtime', error);
      }
    });

    return unsubscribe;
  }, [connected, queryClient, subscribe]);

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
          <ThemedText style={styles.error}>Không thể tải danh sách cuộc trò chuyện</ThemedText>
          <ThemedText onPress={() => void refetch()} style={styles.retry}>
            Thử lại
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => router.push('/(tabs)/search' as any)}
              activeOpacity={0.7}>
              <Ionicons name="search" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => setCreateChatModalVisible(true)}
              activeOpacity={0.7}>
              <View style={styles.newChatButtonContent}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.newChatButtonText}>New Chat</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stories Section */}
        {friends.length > 0 && (
          <View style={styles.storiesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}>
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.storyItem}
                  onPress={() => router.push(`/(tabs)/profile/${friend.id}` as any)}>
                  <Image
                    source={{ uri: friend.avatarUrl || 'https://i.pravatar.cc/150' }}
                    style={styles.storyAvatar}
                  />
                  <Text style={styles.storyName} numberOfLines={1}>
                    {friend.displayName || friend.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Conversations List */}
        <FlatList
          data={conversations ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ConversationListItem conversation={item} onPress={handlePressConversation} />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>Chưa có cuộc trò chuyện</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Nhấn vào "+ New Chat" để bắt đầu cuộc trò chuyện mới
              </ThemedText>
            </View>
          }
        />
      </ThemedView>

      {/* Create Chat Modal */}
      <CreateChatModal
        visible={createChatModalVisible}
        onClose={() => setCreateChatModalVisible(false)}
        onSuccess={handleCreateChatSuccess}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    padding: 4,
  },
  newChatButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newChatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storiesContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    marginBottom: 6,
  },
  storyName: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  error: {
    fontSize: 16,
  },
  retry: {
    color: '#0a84ff',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
