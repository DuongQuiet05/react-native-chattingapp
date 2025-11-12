import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, ScrollView, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConversationListItem } from '@/components/conversation-list-item';
import { CreateChatModal } from '@/components/create-chat-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { conversationQueryKeys, useConversations } from '@/hooks/api/use-conversations';
import { queryKeys } from '@/lib/api/query-keys';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationSummary } from '@/lib/api/conversations';
import { useStomp } from '@/providers/stomp-provider';
import { useAuth } from '@/contexts/auth-context';
import { getFriendsList, type FriendProfile } from '@/lib/api/friends';
export default function ChatsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  
  // Sort conversations: unread messages first, then by lastMessageAt (newest first)
  const sortedConversations = useMemo(() => {
    if (!conversations) {
      return [];
    }
    const sorted = [...conversations];
    sorted.sort((a, b) => {
      const aUnread = (a.unreadCount || 0) > 0;
      const bUnread = (b.unreadCount || 0) > 0;
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted;
  }, [conversations]);
  
  const handlePressConversation = useCallback(
    (conversationId: number) => {
      // Mark conversation as read when clicking on it
      queryClient.setQueryData<ConversationSummary[] | undefined>(
        conversationQueryKeys.all,
        (previous) => {
          if (!previous) {
            return previous;
          }
          return previous.map((item) =>
            item.id === conversationId
              ? { ...item, unreadCount: 0 }
              : item,
          );
        },
      );
      router.push(`/chat/${conversationId}`);
    },
    [router, queryClient],
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
        .catch((error) => {// Don't show alert, just set empty array
          setFriends([]);
        })
        .finally(() => {
          setLoadingFriends(false);
        });
    }, [refetch]),
  );
  // Subscribe to conversation updates from WebSocket
  useEffect(() => {
    if (!connected || !user || !conversations) {
      return;
    }

    // Subscribe to conversation list updates (if backend sends them)
    const unsubscribeConversations = subscribe('/user/queue/conversations', (message) => {
        try {
          const payload = JSON.parse(message.body);
          
          queryClient.setQueryData<ConversationSummary[] | undefined>(
          conversationQueryKeys.all,
          (previous) => {
            if (!previous) {
              return [payload];
            }
            const index = previous.findIndex((item) => item.id === payload.id);
            if (index === -1) {
              // New conversation, add to beginning
              return [payload, ...previous];
            }
            // Update existing conversation
            const updated = [...previous];
            updated[index] = { ...updated[index], ...payload };
            return updated;
          },
            );
          } catch (error) {
            // Error processing conversation update
          }
    });

    // Subscribe to all conversation topics to receive real-time message updates
    const unsubscribes: Array<() => void> = [unsubscribeConversations];
    
    conversations.forEach((conversation) => {
      const destination = `/topic/conversations/${conversation.id}`;
      const unsubscribe = subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          
          // Only process if action is SEND (new message)
          if (payload.action !== 'SEND') {
            return;
          }

          const conversationId = payload.conversationId;
          const senderId = payload.senderId;
          const isFromCurrentUser = senderId === user.id;

          // Get preview text based on message type
          let previewText = payload.content || '';
          if (payload.messageType === 'IMAGE') {
            previewText = '📷 Đã gửi một ảnh';
          } else if (payload.messageType === 'VIDEO') {
            previewText = '🎥 Đã gửi một video';
          } else if (payload.messageType === 'FILE') {
            previewText = '📎 Đã gửi một file';
          }

          queryClient.setQueryData<ConversationSummary[] | undefined>(
            queryKeys.conversations.all,
            (previous) => {
              if (!previous) {
                return previous;
              }

              const index = previous.findIndex((item) => item.id === conversationId);
              if (index === -1) {
                // Conversation not in list
                return previous;
              }

              const updated = [...previous];
              const conversation = updated[index];
              
              // Update conversation with new message info
              updated[index] = {
                ...conversation,
                lastMessagePreview: previewText,
                lastMessageAt: payload.sentAt,
                // Increment unread count if message is not from current user
                unreadCount: isFromCurrentUser 
                  ? (conversation.unreadCount || 0)
                  : (conversation.unreadCount || 0) + 1,
              };

              return updated;
            },
            );
          } catch (error) {
            // Error processing message update
          }
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [connected, queryClient, subscribe, user, conversations]);
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
          <Text style={styles.headerTitle}>Trò chuyện</Text>
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
                <Text style={styles.newChatButtonText}>Tin nhắn mới</Text>
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
          data={sortedConversations}
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