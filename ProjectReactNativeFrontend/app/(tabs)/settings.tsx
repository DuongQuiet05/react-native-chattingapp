import React, { useState, useEffect } from 'react';
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
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile, useUpdateProfile } from '@/hooks/api/use-profile';
import { useUserPosts } from '@/hooks/api/use-posts';
import { useContacts } from '@/hooks/api/use-contacts';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/api/upload-service';
import { Platform, ActionSheetIOS } from 'react-native';
dayjs.extend(relativeTime);
const { width } = Dimensions.get('window');
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: profile, isLoading, refetch } = useUserProfile();
  const { data: postsData } = useUserPosts(user?.id || 0);
  const { data: friends } = useContacts();
  const updateProfile = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<'Activity' | 'Post' | 'Tagged' | 'Media'>('Activity');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
  });
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
      });
    }
  }, [profile]);
  const handleSignOut = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/intro-1');
          } catch (error) {
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };
  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      setShowEditModal(false);
      refetch();
      Alert.alert('Thành công', 'Cập nhật profile thành công');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật profile');
    }
  };
  const handlePickImage = async () => {
    try {
      // Show action sheet to choose between camera and library
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              // Camera
              await pickAndUploadImage('camera');
            } else if (buttonIndex === 2) {
              // Library
              await pickAndUploadImage('library');
            }
          }
        );
      } else {
        // Android: Show Alert with options
        Alert.alert(
          'Chọn ảnh đại diện',
          '',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chụp ảnh', onPress: () => pickAndUploadImage('camera') },
            { text: 'Chọn từ thư viện', onPress: () => pickAndUploadImage('library') },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {}
  };
  const pickAndUploadImage = async (source: 'camera' | 'library') => {
    try {
      setUploading(true);
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
          setUploading(false);
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
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
      if (source === 'camera') {
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
        type: asset.mimeType || 'image/jpeg',
      });
      await updateProfile.mutateAsync({
        avatarUrl: uploadResult.fileUrl,
      });
      // Refresh profile data
      await refetch();
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
    } catch (error: any) {Alert.alert('Lỗi', error.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setUploading(false);
    }
  };
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.', ',') + 'K';
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
  const followersCount = 2800; // Mock data - có thể thay bằng API sau
  const followingCount = friends?.length || 892;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user?.username || profile?.username || 'username'}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          {/* Avatar and Stats */}
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              onPress={handlePickImage} 
              disabled={uploading}
              style={styles.avatarContainer}>
              {uploading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri: profile?.avatarUrl || user?.avatarUrl || 'https://i.pravatar.cc/150',
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{postCount}</Text>
                <Text style={styles.statLabel}>Bài viết</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(followersCount)}</Text>
                <Text style={styles.statLabel}>Người theo dõi</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Đang theo dõi</Text>
              </View>
            </View>
          </View>
          {/* Name and Bio */}
          <Text style={styles.name}>
            {profile?.displayName || user?.displayName || 'Chưa có tên'}
          </Text>
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowEditModal(true)}>
              <Text style={styles.actionButtonText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Chia sẻ hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton}>
              <Ionicons name="person-add-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['Activity', 'Post', 'Tagged', 'Media'] as const).map((tab) => {
            const tabLabels: Record<string, string> = {
              'Activity': 'Hoạt động',
              'Post': 'Bài viết',
              'Tagged': 'Đã gắn thẻ',
              'Media': 'Phương tiện',
            };
            return (
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
                  {tabLabels[tab] || tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Posts Feed */}
        {activeTab === 'Post' && (
          <View style={styles.postsContainer}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <View style={styles.postAuthor}>
                      <Image
                        source={{
                          uri: post.authorAvatar || 'https://i.pravatar.cc/150',
                        }}
                        style={styles.postAvatar}
                      />
                      <View style={styles.postAuthorInfo}>
                        <Text style={styles.postAuthorName}>
                          {post.authorName || profile?.displayName || 'Người dùng'}
                        </Text>
                        <Text style={styles.postTime}>
                          {dayjs(post.createdAt).fromNow()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={20} color="#000000" />
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
                        {post.reactionCount > 0 ? formatNumber(post.reactionCount) : '0'}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons name="chatbubble-outline" size={20} color="#666666" />
                      <Text style={styles.engagementCount}>
                        {post.commentCount > 0 ? formatNumber(post.commentCount) : '0'}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons name="paper-plane-outline" size={20} color="#666666" />
                      <Text style={styles.engagementCount}>
                        {post.shareCount > 0 ? formatNumber(post.shareCount) : '0'}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons name="repeat-outline" size={20} color="#666666" />
                      <Text style={styles.engagementCount}>
                        {post.repostCount > 0 ? formatNumber(post.repostCount) : '0'}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Ionicons name="bookmark-outline" size={20} color="#666666" />
                      <Text style={styles.engagementCount}>
                        {post.bookmarkCount > 0 ? formatNumber(post.bookmarkCount) : '0'}
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
        {activeTab === 'Activity' && (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
          </View>
        )}
        {/* Tagged Tab - Empty state for now */}
        {activeTab === 'Tagged' && (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có bài viết được tag</Text>
          </View>
        )}
        {/* Media Tab - Empty state for now */}
        {activeTab === 'Media' && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có media nào</Text>
          </View>
        )}
      </ScrollView>
      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tên hiển thị</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.displayName}
                  onChangeText={(text) => setEditForm({ ...editForm, displayName: text })}
                  placeholder="Nhập tên hiển thị"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Giới thiệu</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                  placeholder="Nhập giới thiệu"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.dateOfBirth}
                  onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.gender}
                  onChangeText={(text) => setEditForm({ ...editForm, gender: text })}
                  placeholder="Nam/Nữ/Khác"
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleUpdateProfile}
                disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Settings Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.settingsModalContent}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            {/* Settings Options */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                router.push('/(tabs)/privacy-settings' as any);
              }}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="lock-closed-outline" size={24} color="#000000" />
                <Text style={styles.settingsOptionText}>Cài đặt quyền riêng tư</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                router.push('/(tabs)/blocked-users' as any);
              }}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="person-remove-outline" size={24} color="#000000" />
                <Text style={styles.settingsOptionText}>Người dùng đã chặn</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                handleSignOut();
              }}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <Text style={[styles.settingsOptionText, styles.settingsOptionTextDanger]}>
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
    backgroundColor: '#FFFFFF',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    margin: Spacing.md,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  actionIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#000000',
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
  postsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  postTime: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  postImage: {
    width: '100%',
    height: width * 0.9,
    backgroundColor: '#F0F0F0',
  },
  postEngagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 15,
    color: '#000000',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalButtonSave: {
    backgroundColor: '#000000',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Settings Modal Styles
  settingsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  settingsOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingsOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  settingsOptionTextDanger: {
    color: '#FF3B30',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: Spacing.sm,
  },
});