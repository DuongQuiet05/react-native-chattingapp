import { Spacing } from "@/constants/theme";
import { useContacts } from "@/hooks/api/use-contacts";
import {
  useConversations,
  useCreateConversation,
} from "@/hooks/api/use-conversations";
import { useFriendRequests } from "@/hooks/api/use-friend-requests";
import { useFriendRequestsCount } from "@/hooks/api/use-friend-requests-count";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { FriendRequest } from "@/lib/api/friends";
import type { Contact } from "@/lib/api/users";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
dayjs.extend(relativeTime);
export default function ContactsScreen() {
  const {
    data: contacts,
    isLoading: contactsLoading,
    isError: contactsError,
    refetch: refetchContacts,
    isFetching: contactsFetching,
  } = useContacts();
  const {
    data: friendRequests,
    isLoading: requestsLoading,
    isError: requestsError,
    refetch: refetchRequests,
    isFetching: requestsFetching,
  } = useFriendRequests();
  const { data: friendRequestCount } = useFriendRequestsCount();
  const colorScheme = useColorScheme();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Fetch conversations to check if chat exists
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();

  const handleSendMessage = async () => {
    if (!selectedContact) return;

    setPopoverVisible(false);

    // 1. Check if conversation exists
    const existingConversation = conversations?.find(
      (c) => c.type === "PRIVATE" && c.otherUserId === selectedContact.id
    );

    if (existingConversation) {
      router.push(`/chat/${existingConversation.id}`);
      return;
    }

    // 2. If not, create new conversation
    setIsCreatingChat(true); // You might want to show global loading here
    try {
      const newConv = await createConversation.mutateAsync({
        type: "PRIVATE",
        participantIds: [selectedContact.id],
      });
      router.push(`/chat/${newConv.id}`);
    } catch (error) {
      console.error("Failed to create conversation", error);
      // Optional: Show alert
    } finally {
      setIsCreatingChat(false);
    }
  };

  const sections = useMemo(() => {
    const result = [];
    // Add friend requests section if there are any
    if (friendRequests && friendRequests.length > 0) {
      result.push({
        title: "Lời mời kết bạn",
        data: friendRequests,
        type: "requests" as const,
      });
    }
    // Add friends section
    if (contacts && contacts.length > 0) {
      result.push({
        title: "Bạn bè",
        data: contacts,
        type: "friends" as const,
      });
    }
    return result;
  }, [friendRequests, contacts]);
  const handleRefresh = useCallback(() => {
    void refetchContacts();
    void refetchRequests();
  }, [refetchContacts, refetchRequests]);
  const renderFriendRequestItem = useCallback(
    ({ item }: { item: FriendRequest }) => {
      const timeAgo = dayjs(item.createdAt).fromNow();
      const displayName = item.sender.displayName ?? item.sender.username;
      return (
        <TouchableOpacity
          style={styles.requestContainer}
          onPress={() => {
            router.push("/(tabs)/friend-requests" as any);
          }}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: item.sender.avatarUrl || "https://i.pravatar.cc/150",
            }}
            style={styles.avatar}
          />
          <View style={styles.requestInfo}>
            <Text style={styles.requestText}>
              <Text style={styles.requestNameText}>{displayName}</Text>
              <Text style={styles.requestMessageText}>
                {" "}
                đã gửi lời mời kết bạn
              </Text>
            </Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    []
  );
  const renderFriendItem = useCallback(
    ({ item }: { item: Contact }) => {
      const lastSeenLabel = item.lastSeen
        ? dayjs(item.lastSeen).fromNow()
        : "Không rõ";
      const isOnline = item.status === "ONLINE";
      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={(event) => {
            const target = event.currentTarget as any;
            target.measure(
              (
                x: number,
                y: number,
                width: number,
                height: number,
                pageX: number,
                pageY: number
              ) => {
                setPopoverPosition({
                  x: pageX + width - 200,
                  y: pageY + height,
                });
                setSelectedContact(item);
                setPopoverVisible(true);
              }
            );
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.avatarUrl || "https://i.pravatar.cc/150" }}
              style={styles.avatar}
            />
            {isOnline && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.nameText}>
              {item.displayName ?? item.username}
            </Text>
            <Text style={styles.itemSubtitle}>
              {isOnline ? "Đang hoạt động" : `Hoạt động ${lastSeenLabel}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      );
    },
    [setPopoverPosition, setSelectedContact, setPopoverVisible]
  );
  const renderSectionHeader = useCallback(
    ({ section }: { section: (typeof sections)[0] }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.type === "requests" && section.data.length > 0 && (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => router.push("/(tabs)/friend-requests" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    []
  );
  const renderItem = useCallback(
    ({ item, section }: { item: any; section: (typeof sections)[0] }) => {
      if (section.type === "requests") {
        return renderFriendRequestItem({ item });
      }
      return renderFriendItem({ item });
    },
    [renderFriendRequestItem, renderFriendItem]
  );
  // Only show loading on initial fetch when there's no data yet
  const isLoading =
    (contactsLoading && !contacts) || (requestsLoading && !friendRequests);
  const isError = contactsError && requestsError;
  const isFetching = contactsFetching || requestsFetching;
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Không thể tải danh sách</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: "#fff" }]}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: "#fff" }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: "#fff", borderBottomColor: "#f0f0f0" },
          ]}
        >
          <Text style={styles.headerTitle}>Contacts</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                router.push("/(tabs)/search" as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={22} color="#2e8a8a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(tabs)/friend-requests" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={22} color="#2e8a8a" />
              {friendRequestCount !== undefined && friendRequestCount > 0 && (
                <View style={styles.badge} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có bạn bè nào</Text>
            <Text style={styles.emptySubtitle}>
              Tìm kiếm và kết bạn với người khác để bắt đầu trò chuyện
            </Text>
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => router.push("/(tabs)/search" as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.addFriendButtonText}>Tìm bạn bè</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections as any}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            refreshing={isFetching}
            onRefresh={handleRefresh}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
      {/* Friend Actions Popover */}
      <Modal
        visible={popoverVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopoverVisible(false)}
      >
        <TouchableOpacity
          style={styles.popoverOverlay}
          activeOpacity={1}
          onPress={() => setPopoverVisible(false)}
        >
          <View
            style={[
              styles.popoverContainer,
              {
                position: "absolute",
                top: popoverPosition.y,
                left: popoverPosition.x,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.popoverOption}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#2e8a8a" />
              <Text style={styles.popoverText}>Nhắn tin</Text>
            </TouchableOpacity>
            <View style={styles.popoverDivider} />
            <TouchableOpacity
              style={styles.popoverOption}
              onPress={() => {
                setPopoverVisible(false);
                if (selectedContact) {
                  router.push(`/(tabs)/profile/${selectedContact.id}` as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={22} color="#2e8a8a" />
              <Text style={styles.popoverText}>Trang cá nhân</Text>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
  },
  headerTitle: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(46, 138, 138, 0.06)", // #2e8a8a nhạt
    color: "#2e8a8a",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerButtons: {
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ff3b30",
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#000",
  },
  retry: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: "#2e8a8a",
    paddingLeft: 12,
    paddingVertical: 10,
  },
  seeAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f8fafa",
    borderWidth: 1,
    borderColor: "#e8f4f4",
  },
  seeAllText: {
    fontSize: 13,
    color: "#2e8a8a",
    fontWeight: "600",
  },
  requestContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8f4f4",
    shadowColor: "#2e8a8a",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  requestText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  requestNameText: {
    fontWeight: "600",
    color: "#000",
  },
  requestMessageText: {
    fontWeight: "400",
    color: "#333",
  },
  requestTimeText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0f0",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  separator: {
    height: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  addFriendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  popoverOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  popoverContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popoverOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  popoverText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2e8a8a",
  },
  popoverDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 12,
  },
});
