import { ConversationListItem } from "@/components/conversation-list-item";
import { CreateChatModal } from "@/components/create-chat-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import {
  conversationQueryKeys,
  useConversations,
} from "@/hooks/api/use-conversations";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ConversationSummary } from "@/lib/api/conversations";
import { getFriendsList, type FriendProfile } from "@/lib/api/friends";
import { queryKeys } from "@/lib/api/query-keys";
import { useStomp } from "@/providers/stomp-provider";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

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
            item.id === conversationId ? { ...item, unreadCount: 0 } : item
          );
        }
      );
      router.push(`/chat/${conversationId}`);
    },
    [router, queryClient]
  );
  const handleCreateChatSuccess = useCallback(
    (conversationId: number) => {
      setCreateChatModalVisible(false);
      router.push(`/chat/${conversationId}`);
    },
    [router]
  );
  useFocusEffect(
    useCallback(() => {
      void refetch();
      // Load friends for stories
      setLoadingFriends(true);
      getFriendsList()
        .then((friendsList) => {
          if (Array.isArray(friendsList)) {
            setFriends(friendsList.slice(0, 10)); // Get first 10 friends for stories
          } else {
            setFriends([]);
          }
        })
        .catch((error) => {
          setFriends([]);
        })
        .finally(() => {
          setLoadingFriends(false);
        });
    }, [refetch])
  );
  // Subscribe to conversation updates from WebSocket
  useEffect(() => {
    if (!connected || !user || !conversations) {
      return;
    }

    // Subscribe to conversation list updates (if backend sends them)
    const unsubscribeConversations = subscribe(
      "/user/queue/conversations",
      (message) => {
        try {
          const payload = JSON.parse(message.body);

          queryClient.setQueryData<ConversationSummary[] | undefined>(
            conversationQueryKeys.all,
            (previous) => {
              if (!previous) {
                return [payload];
              }
              const index = previous.findIndex(
                (item) => item.id === payload.id
              );
              if (index === -1) {
                // New conversation, add to beginning
                return [payload, ...previous];
              }
              // Update existing conversation
              const updated = [...previous];
              updated[index] = { ...updated[index], ...payload };
              return updated;
            }
          );
        } catch (error) {
          // Error processing conversation update
        }
      }
    );

    // Subscribe to all conversation topics to receive real-time message updates
    const unsubscribes: (() => void)[] = [unsubscribeConversations];

    conversations.forEach((conversation) => {
      const destination = `/topic/conversations/${conversation.id}`;
      const unsubscribe = subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body);

          // Only process if action is SEND (new message)
          if (payload.action !== "SEND") {
            return;
          }

          const conversationId = payload.conversationId;
          const senderId = payload.senderId;
          const isFromCurrentUser = senderId === user.id;

          // Get preview text based on message type
          let previewText = payload.content || "";
          if (payload.messageType === "IMAGE") {
            previewText = "📷 Đã gửi một ảnh";
          } else if (payload.messageType === "VIDEO") {
            previewText = "🎥 Đã gửi một video";
          } else if (payload.messageType === "FILE") {
            previewText = "📎 Đã gửi một file";
          }

          queryClient.setQueryData<ConversationSummary[] | undefined>(
            queryKeys.conversations.all,
            (previous) => {
              if (!previous) {
                return previous;
              }

              const index = previous.findIndex(
                (item) => item.id === conversationId
              );
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
                  ? conversation.unreadCount || 0
                  : (conversation.unreadCount || 0) + 1,
              };

              return updated;
            }
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.error}>
            Không thể tải danh sách cuộc trò chuyện
          </ThemedText>
          <ThemedText onPress={() => void refetch()} style={styles.retry}>
            Thử lại
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.headerLogo}>LUMO</Text>
              <View style={styles.logoBadge} />
            </View>
            <Text style={styles.headerSubtitle}>Messages</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(tabs)/search" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={22} color="#2e8a8a" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Stories Section */}
        {/* Stories Section (Circular) */}
        {friends.length > 0 && (
          <View style={styles.storiesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}
            >
              {friends.map((friend) => {
                const displayName = friend.displayName || friend.username;
                // Lấy từ cuối cùng của tên
                const lastName =
                  displayName.trim().split(/\s+/).pop() || displayName;

                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.storyItem}
                    onPress={() =>
                      router.push(`/(tabs)/profile/${friend.id}` as any)
                    }
                  >
                    <LinearGradient
                      colors={["#2e8a8a", "#3da3a3", "#4dbdbd"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.storyAvatarContainer}
                    >
                      <View style={styles.storyAvatarGradient}>
                        <Image
                          source={{
                            uri:
                              friend.avatarUrl || "https://i.pravatar.cc/150",
                          }}
                          style={styles.storyAvatar}
                        />
                      </View>
                    </LinearGradient>
                    <Text style={styles.storyName} numberOfLines={1}>
                      {lastName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* Add Friend Button */}
              <TouchableOpacity
                style={styles.addFriendButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/search",
                    params: { usersOnly: "true" },
                  } as any)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.addFriendText}>+{"  "}Thêm bạn mới</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        {/* Conversations List */}
        <View style={{ flex: 1 }}>
          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đoạn chat của bạn</Text>
          </View>
          <FlatList
            data={sortedConversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ConversationListItem
                conversation={item}
                onPress={handlePressConversation}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isManualRefreshing}
                onRefresh={async () => {
                  setIsManualRefreshing(true);
                  await refetch();
                  setIsManualRefreshing(false);
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>
                  Chưa có cuộc trò chuyện
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Nhấn vào nút bên dưới để bắt đầu cuộc trò chuyện mới
                </ThemedText>
              </View>
            }
          />
          {/* Floating New Chat Button */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setCreateChatModalVisible(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="people" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerLogo: {
    fontSize: 36,
    fontWeight: "900",
    color: "#2e8a8a",
    letterSpacing: 3,
  },
  logoBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4dbdbd",
    marginTop: 2,
    marginLeft: 5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E8E93",
    marginLeft: 4,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f8fafa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8f4f4",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e8a8a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2e8a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  storiesContainer: {
    backgroundColor: "#f8fafa",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f4f4",
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    width: 68,
  },
  storyAvatarContainer: {
    padding: 2.5,
    borderRadius: 34,
    marginBottom: 6,
  },
  storyAvatarGradient: {
    padding: 2.5,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 28,
    backgroundColor: "#f0f0f0",
  },
  addFriendButton: {
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#2e8a8a",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#2e8a8a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    alignSelf: "flex-start",
    marginTop: 24,
  },
  addFriendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  storyName: {
    fontSize: 11,
    fontWeight: "400",
    color: "black",
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  error: {
    fontSize: 16,
  },
  retry: {
    color: "#0a84ff",
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 64,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
});
