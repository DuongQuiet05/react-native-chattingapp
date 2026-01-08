import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useContacts } from "@/hooks/api/use-contacts";
import { useUserPosts } from "@/hooks/api/use-posts";
import { useUpdateProfile, useUserProfile } from "@/hooks/api/use-profile";
import { uploadImage } from "@/lib/api/upload-service";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

dayjs.extend(relativeTime);
const { width } = Dimensions.get("window");
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = "light";
  const colors = Colors["light"];
  const { data: profile, isLoading, refetch } = useUserProfile();
  const { data: postsData } = useUserPosts(user?.id || 0);
  const { data: friends } = useContacts();
  const updateProfile = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<"Activity" | "Post" | "Tagged">(
    "Post"
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    dateOfBirth: "",
    gender: "",
  });
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
      });
    }
  }, [profile]);
  const handleSignOut = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/intro-1");
          } catch (error) {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  };
  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setShowEditModal(false);
      setEditingField(null);
      refetch();
      Alert.alert("Thành công", "Cập nhật profile thành công");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật profile");
    }
  };

  const openFieldEdit = (fieldName: string) => {
    setEditingField(fieldName);
    setShowEditModal(true);
  };

  const closeFieldEdit = () => {
    setEditingField(null);
    setShowEditModal(false);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;
    // Format: +84 863 995 285
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("84")) {
      return `+84 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(
        8
      )}`;
    }
    if (cleaned.startsWith("0")) {
      return `+84 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(
        7
      )}`;
    }
    return phone;
  };
  const handlePickImage = async () => {
    try {
      // Show action sheet to choose between camera and library
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Hủy", "Chụp ảnh", "Chọn từ thư viện"],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              // Camera
              await pickAndUploadImage("camera");
            } else if (buttonIndex === 2) {
              // Library
              await pickAndUploadImage("library");
            }
          }
        );
      } else {
        // Android: Show Alert with options
        Alert.alert(
          "Chọn ảnh đại diện",
          "",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Chụp ảnh", onPress: () => pickAndUploadImage("camera") },
            {
              text: "Chọn từ thư viện",
              onPress: () => pickAndUploadImage("library"),
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {}
  };
  const pickAndUploadImage = async (source: "camera" | "library") => {
    try {
      setUploading(true);
      // Request permissions
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Cần quyền truy cập",
            "Vui lòng cấp quyền truy cập camera"
          );
          setUploading(false);
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Cần quyền truy cập",
            "Vui lòng cấp quyền truy cập thư viện ảnh"
          );
          setUploading(false);
          return;
        }
      }
      // Launch image picker
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }
      if (result.canceled || !result.assets[0]) {
        setUploading(false);
        return;
      }
      const asset = result.assets[0];
      // Upload image to server
      const uploadResult = await uploadImage({
        uri: asset.uri,
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
      await updateProfile.mutateAsync({
        avatarUrl: uploadResult.fileUrl,
      });
      // Refresh profile data
      await refetch();
      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật ảnh đại diện");
    } finally {
      setUploading(false);
    }
  };
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".", ",") + "K";
    }
    return num.toString();
  };
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  // Filter out hidden posts (user can see their own hidden posts, but not others')
  const posts = (postsData?.content || []).filter((post) => {
    // If viewing own profile, show all posts (including hidden ones)
    // Otherwise, filter out hidden posts
    if (user?.id && post.authorId === user.id) {
      return true; // User can see their own hidden posts
    }
    return !post.isHidden; // Hide posts from other users that are marked as hidden
  });
  const postCount = posts.length; // Use filtered count
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#fff" }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#fff" }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: "#F6F6F6" }]}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          {/* Avatar and Info */}
          <View style={styles.profileHeader}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading}
              style={styles.avatarContainer}
            >
              {uploading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri:
                        profile?.avatarUrl ||
                        user?.avatarUrl ||
                        "https://i.pravatar.cc/150",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <TouchableOpacity
                style={styles.nameEditContainer}
                onPress={() => openFieldEdit("displayName")}
              >
                <Text style={styles.name}>
                  {profile?.displayName || user?.displayName || "Chưa có tên"}
                </Text>
                <Ionicons name="pencil" size={16} color="#666666" />
              </TouchableOpacity>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>
                  @{user?.username || profile?.username || "username"}
                </Text>
                {profile?.isPhoneVerified && (
                  <View style={styles.verifiedBadgeInline}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#4CAF50"
                    />
                  </View>
                )}
              </View>
              {/* Role and Updated Badge */}
              {(profile?.role || profile?.updatedAt) && (
                <View style={styles.metaInfoBadge}>
                  {profile?.role && (
                    <Text style={styles.metaInfoText}>
                      {profile.role === "ADMIN" ? "Admin" : "User"}
                    </Text>
                  )}
                  {profile?.role && profile?.updatedAt && (
                    <Text style={styles.metaInfoSeparator}> | </Text>
                  )}
                  {profile?.updatedAt && (
                    <Text style={styles.metaInfoText}>
                      cập nhật {dayjs(profile.updatedAt).fromNow()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Editable Profile Fields */}
          <View style={styles.editableFieldsSection}>
            {/* Bio */}
            <View style={styles.editableField}>
              <View style={styles.fieldContent}>
                <TouchableOpacity
                  style={styles.fieldHeaderRow}
                  onPress={() => openFieldEdit("bio")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.fieldLabel}>Giới thiệu</Text>
                  <Ionicons
                    name="pencil-outline"
                    size={14}
                    color="#999999"
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {profile?.bio || "Chưa có giới thiệu"}
                </Text>
              </View>
            </View>

            {/* Phone Number */}
            {profile?.phoneNumber && (
              <View style={styles.editableField}>
                <View style={styles.fieldContent}>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Số điện thoại</Text>
                    {profile.isPhoneVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>Đã xác thực</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fieldValue}>
                    {formatPhoneNumber(profile.phoneNumber)}
                  </Text>
                </View>
              </View>
            )}

            {/* Date of Birth */}
            <View style={styles.editableField}>
              <View style={styles.fieldContent}>
                <TouchableOpacity
                  style={styles.fieldHeaderRow}
                  onPress={() => openFieldEdit("dateOfBirth")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>
                  <Ionicons
                    name="pencil-outline"
                    size={14}
                    color="#999999"
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.fieldValue}>
                  {profile?.dateOfBirth
                    ? dayjs(profile.dateOfBirth).format("DD/MM/YYYY")
                    : "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            {/* Gender */}
            <View style={styles.editableField}>
              <View style={styles.fieldContent}>
                <TouchableOpacity
                  style={styles.fieldHeaderRow}
                  onPress={() => openFieldEdit("gender")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.fieldLabel}>Giới tính</Text>
                  <Ionicons
                    name="pencil-outline"
                    size={14}
                    color="#999999"
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.fieldValue}>
                  {profile?.gender || "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            {/* Account Created Date */}
            {profile?.createdAt && (
              <View style={styles.editableField}>
                <View style={styles.fieldContent}>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Tham gia</Text>
                  </View>
                  <Text style={styles.fieldValue}>
                    {dayjs(profile.createdAt).format("DD/MM/YYYY")}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Blocked Status Banner */}
          {profile?.isBlocked && (
            <View style={styles.blockedBanner}>
              <Ionicons name="ban" size={18} color="#FF3B30" />
              <Text style={styles.blockedText}>Tài khoản đã bị chặn</Text>
            </View>
          )}
        </View>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(["Post", "Activity", "Tagged"] as const).map((tab) => {
            const tabLabels: Record<string, string> = {
              Activity: "Hoạt động",
              Post: "Bài viết",
              Tagged: "Đã gắn thẻ",
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tabLabels[tab] || tab}
                  {tab === "Post" && ` · ${postCount}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Posts Feed */}
        {activeTab === "Post" && (
          <View style={styles.postsContainer}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <View style={styles.postAuthor}>
                      <Image
                        source={{
                          uri: post.authorAvatar || "https://i.pravatar.cc/150",
                        }}
                        style={styles.postAvatar}
                      />
                      <View style={styles.postAuthorInfo}>
                        <Text style={styles.postAuthorName}>
                          {post.authorName ||
                            profile?.displayName ||
                            "Người dùng"}
                        </Text>
                        <Text style={styles.postTime}>
                          {dayjs(post.createdAt).fromNow()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Post Content */}
                  {post.content && (
                    <Text style={styles.postContent}>{post.content}</Text>
                  )}
                  {/* Post Image */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <Image
                      source={{ uri: post.mediaUrls[0] }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}
                  {/* Engagement Metrics */}
                  <View style={styles.postEngagement}>
                    <View style={styles.engagementItem}>
                      <Ionicons name="heart" size={20} color="#FF3040" />
                      <Text style={styles.engagementCount}>
                        {post.reactionCount > 0
                          ? formatNumber(post.reactionCount)
                          : "0"}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#666666"
                      />
                      <Text style={styles.engagementCount}>
                        {post.commentCount > 0
                          ? formatNumber(post.commentCount)
                          : "0"}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="paper-plane-outline"
                        size={20}
                        color="#666666"
                      />
                      <Text style={styles.engagementCount}>
                        {post.shareCount && post.shareCount > 0
                          ? formatNumber(post.shareCount)
                          : "0"}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="repeat-outline"
                        size={20}
                        color="#666666"
                      />
                      <Text style={styles.engagementCount}>
                        {post.repostCount && post.repostCount > 0
                          ? formatNumber(post.repostCount)
                          : "0"}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="bookmark-outline"
                        size={20}
                        color="#666666"
                      />
                      <Text style={styles.engagementCount}>
                        {post.bookmarkCount && post.bookmarkCount > 0
                          ? formatNumber(post.bookmarkCount)
                          : "0"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              </View>
            )}
          </View>
        )}
        {/* Activity Tab - Empty state for now */}
        {activeTab === "Activity" && (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
          </View>
        )}
        {/* Tagged Tab - Empty state for now */}
        {activeTab === "Tagged" && (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có bài viết được tag</Text>
          </View>
        )}
      </ScrollView>
      {/* Edit Field Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={closeFieldEdit}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentSmall}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Chỉnh sửa{" "}
                  {editingField === "displayName"
                    ? "tên hiển thị"
                    : editingField === "bio"
                    ? "giới thiệu"
                    : editingField === "dateOfBirth"
                    ? "ngày sinh"
                    : editingField === "gender"
                    ? "giới tính"
                    : ""}
                </Text>
                <TouchableOpacity onPress={closeFieldEdit}>
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {editingField === "displayName" && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={editForm.displayName}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, displayName: text })
                      }
                      placeholder="Nhập tên hiển thị"
                      autoFocus
                    />
                  </View>
                )}
                {editingField === "bio" && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editForm.bio}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, bio: text })
                      }
                      placeholder="Nhập giới thiệu"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </View>
                )}
                {editingField === "dateOfBirth" && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={editForm.dateOfBirth}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, dateOfBirth: text })
                      }
                      placeholder="YYYY-MM-DD"
                      autoFocus
                    />
                  </View>
                )}
                {editingField === "gender" && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={editForm.gender}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, gender: text })
                      }
                      placeholder="Nam/Nữ/Khác"
                      autoFocus
                    />
                  </View>
                )}
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={closeFieldEdit}
                >
                  <Text style={styles.modalButtonCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonSaveText}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
      {/* Settings Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.settingsModalContent}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            {/* Settings Options */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                router.push("/(tabs)/privacy-settings" as any);
              }}
            >
              <View style={styles.settingsOptionLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#000000"
                />
                <Text style={styles.settingsOptionText}>
                  Cài đặt quyền riêng tư
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                router.push("/(tabs)/blocked-users" as any);
              }}
            >
              <View style={styles.settingsOptionLeft}>
                <Ionicons
                  name="person-remove-outline"
                  size={24}
                  color="#000000"
                />
                <Text style={styles.settingsOptionText}>
                  Người dùng đã chặn
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                handleSignOut();
              }}
            >
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <Text
                  style={[
                    styles.settingsOptionText,
                    styles.settingsOptionTextDanger,
                  ]}
                >
                  Đăng xuất
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
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
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.sm,
    margin: Spacing.sm,
    marginVertical: Spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A898B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  verifiedBadgeInline: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  metaInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  metaInfoText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#999999",
  },
  metaInfoSeparator: {
    fontSize: 10,
    color: "#CCCCCC",
  },
  editableFieldsSection: {
    marginTop: 0,
  },
  editableField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
  fieldContent: {
    flex: 1,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#2e8a8a",
    paddingLeft: Spacing.sm,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(46, 138, 138, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editIcon: {
    marginLeft: 6,
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
    marginLeft: Spacing.sm + 3,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 6,
    backgroundColor: "#eeeeee67",
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#2A898B",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999999",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  postsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  postTime: {
    fontSize: 12,
    color: "#999999",
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#000000",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  postImage: {
    width: "100%",
    height: width * 0.9,
    backgroundColor: "#F0F0F0",
  },
  postEngagement: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  engagementCount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContentSmall: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
  },
  modalBody: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    fontSize: 14,
    color: "#000000",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  textArea: {
    minHeight: 90,
    paddingTop: 10,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  modalButtonSave: {
    backgroundColor: "#2A898B",
  },
  modalButtonSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Settings Modal Styles
  settingsModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CCCCCC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  settingsOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  settingsOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingsOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  settingsOptionTextDanger: {
    color: "#FF3B30",
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: Spacing.sm,
  },
  // Profile Info Styles
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4CAF50",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF8C00",
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  blockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF3B30",
    marginTop: Spacing.sm,
  },
  blockedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF3B30",
    flex: 1,
  },
});
