import { useCreateConversation } from "@/hooks/api/use-conversations";
import { useFileUpload } from "@/hooks/use-file-upload";
import { type CreateConversationRequest } from "@/lib/api/conversations";
import { getFriendsList, type FriendProfile } from "@/lib/api/friends";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface CreateChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (conversationId: number) => void;
}
type ChatType = "GROUP";
export function CreateChatModal({
  visible,
  onClose,
  onSuccess,
}: CreateChatModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    []
  );
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [groupNameError, setGroupNameError] = useState("");
  const [participantsError, setParticipantsError] = useState("");
  const [apiError, setApiError] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);
  const createConversationMutation = useCreateConversation();
  const { pickAndUploadImage, isUploading: isImageUploading } = useFileUpload();
  // Load friends list
  useEffect(() => {
    if (visible) {
      setLoadingFriends(true);
      getFriendsList()
        .then((friendsList) => {
          // Handle empty list gracefully
          if (Array.isArray(friendsList)) {
            setFriends(friendsList);
          } else {
            setFriends([]);
          }
        })
        .catch((error) => {
          // Set empty array instead of showing alert
          setFriends([]);
          // Only show alert if it's not a 400 error (which might mean no friends)
          if (error?.status !== 400) {
            Alert.alert("Lỗi", "Không thể tải danh sách bạn bè");
          }
        })
        .finally(() => {
          setLoadingFriends(false);
        });
    }
  }, [visible]);
  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setGroupName("");
      setSelectedParticipants([]);
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setAvatarUrl(null);
      setGroupNameError("");
      setParticipantsError("");
      setApiError("");
    }
  }, [visible]);
  // Filter friends based on debounced search query
  const filteredFriends = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return friends;
    }
    const query = debouncedSearchQuery.toLowerCase().trim();
    return friends.filter(
      (friend) =>
        friend.displayName?.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query)
    );
  }, [friends, debouncedSearchQuery]);
  const toggleParticipant = (userId: number) => {
    setParticipantsError("");
    setApiError("");
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handlePickImage = async () => {
    const result = await pickAndUploadImage();
    if (result?.fileUrl) {
      setAvatarUrl(result.fileUrl);
    }
  };
  const handleCreate = async () => {
    // Reset errors
    setGroupNameError("");
    setParticipantsError("");
    setApiError("");

    // Validate
    let hasError = false;
    if (!groupName.trim()) {
      setGroupNameError("Vui lòng nhập tên nhóm");
      hasError = true;
    }
    if (selectedParticipants.length < 2) {
      setParticipantsError(
        "Vui lòng chọn ít nhất 2 thành viên (tối thiểu 3 người bao gồm bạn)"
      );
      hasError = true;
    }

    if (hasError) return;

    try {
      const payload: CreateConversationRequest = {
        type: "GROUP",
        participantIds: selectedParticipants,
        groupName: groupName.trim(),
        groupAvatarUrl: avatarUrl || undefined,
      };
      const response = await createConversationMutation.mutateAsync(payload);
      onSuccess(response.id);
      onClose();
    } catch (error: any) {
      // Display error message from backend if available
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo cuộc trò chuyện. Vui lòng thử lại.";
      setApiError(errorMessage);
    }
  };
  const renderFriendItem = ({ item }: { item: FriendProfile }) => {
    const isSelected = selectedParticipants.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleParticipant(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatarUrl || "https://i.pravatar.cc/150" }}
          style={styles.friendAvatar}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.displayName || item.username}
          </Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="rgba(46, 138, 138, 0.7)"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2e8a8a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo nhóm chat mới</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Avatar Picker */}
        <View style={styles.avatarPickerContainer}>
          <View style={styles.avatarDashedBorder}>
            <TouchableOpacity
              style={styles.avatarPicker}
              onPress={handlePickImage}
              disabled={isImageUploading}
              activeOpacity={0.7}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={36} color="#2e8a8a" />
                  <Text style={styles.cameraText}>Chọn ảnh</Text>
                </View>
              )}
              {isImageUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#999"
            />{" "}
            Ảnh nhóm (Tùy chọn)
          </Text>
        </View>

        {/* Group Name Input */}
        <View style={styles.groupNameContainer}>
          <View
            style={[styles.inputWrapper, groupNameError && styles.inputError]}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color="#2e8a8a"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.groupNameInput}
              placeholder="Tên nhóm chat"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={(text) => {
                setGroupName(text);
                setGroupNameError("");
                setApiError("");
              }}
              maxLength={50}
            />
          </View>
          {groupNameError ? (
            <Text style={styles.errorText}>{groupNameError}</Text>
          ) : (
            <Text style={styles.inputHelper}>{groupName.length}/50 ký tự</Text>
          )}
        </View>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.sectionLabel}>Chọn thành viên</Text>
          <View
            style={[
              styles.searchContainer,
              participantsError && styles.inputError,
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color="#2e8a8a"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bạn bè..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {participantsError && (
            <Text style={styles.errorText}>{participantsError}</Text>
          )}
        </View>
        {/* Friends List */}
        {loadingFriends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriendItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name={
                      debouncedSearchQuery ? "search-outline" : "people-outline"
                    }
                    size={64}
                    color="#e0e0e0"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {debouncedSearchQuery
                    ? "Không tìm thấy kết quả"
                    : friends.length === 0 && !loadingFriends
                    ? "Chưa có bạn bè"
                    : "Chưa có bạn bè"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {debouncedSearchQuery
                    ? `Không tìm thấy bạn bè với từ khóa "${debouncedSearchQuery}"`
                    : "Hãy kết bạn trước khi tạo nhóm chat"}
                </Text>
              </View>
            }
          />
        )}
        {/* Selected Count & Create Button */}
        {selectedParticipants.length > 0 && (
          <View style={styles.footer}>
            {apiError ? (
              <View style={styles.apiErrorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff3b30" />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : (
              <View style={styles.selectedInfoContainer}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>
                    {selectedParticipants.length}
                  </Text>
                </View>
                <View style={styles.selectedTextContainer}>
                  <Text style={styles.selectedLabel}>Đã chọn</Text>
                  {selectedParticipants.length < 2 && (
                    <Text style={styles.warningText}>
                      Cần thêm {2 - selectedParticipants.length} người nữa
                    </Text>
                  )}
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.createButton,
                (createConversationMutation.isPending ||
                  selectedParticipants.length < 2 ||
                  isImageUploading) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={
                createConversationMutation.isPending ||
                selectedParticipants.length < 2 ||
                isImageUploading
              }
            >
              {createConversationMutation.isPending || isImageUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.createButtonText}>Tạo nhóm</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 32,
  },
  typeSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  groupNameContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  inputError: {
    borderColor: "#ff3b30",
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  inputHelper: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ff3b30",
    marginTop: 6,
    marginLeft: 4,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  friendItemSelected: {
    backgroundColor: "rgba(46, 138, 138, 0.06)",
    borderLeftWidth: 3,
    borderLeftColor: "#2e8a8a",
  },
  friendAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#d0d5dd",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 3,
  },
  friendUsername: {
    fontSize: 13,
    color: "#999",
  },
  checkmark: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4,
  },
  apiErrorContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  apiErrorText: {
    flex: 1,
    fontSize: 13,
    color: "#ff3b30",
    fontWeight: "500",
  },
  selectedInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(46, 138, 138, 0.1)",
    borderWidth: 1.5,
    borderColor: "#2e8a8a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e8a8a",
  },
  selectedTextContainer: {
    flexDirection: "column",
    gap: 2,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  warningText: {
    fontSize: 12,
    color: "#ff9500",
    fontWeight: "500",
  },
  createButton: {
    backgroundColor: "#2e8a8a",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#2e8a8a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarPickerContainer: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarDashedBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: "#2e8a8a",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(46, 138, 138, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2e8a8a",
    marginTop: 4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 13,
    fontWeight: "400",
    color: "#999",
    textAlign: "center",
  },
});
