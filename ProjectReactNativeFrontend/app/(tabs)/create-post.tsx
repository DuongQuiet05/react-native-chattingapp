import React, { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePost } from '@/hooks/api/use-posts';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, uploadVideo } from '@/lib/api/upload-service';
const { width } = Dimensions.get('window');
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class CreatePostErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container} edges={[]}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorText}>Đã xảy ra lỗi</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'Vui lòng thử lại'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                this.setState({ hasError: false, error: null });
              }}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryButton, { marginTop: 10, backgroundColor: '#666' }]}
              onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
function CreatePostScreenContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const createPost = useCreatePost();
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [privacyType, setPrivacyType] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  // Local media files (before upload) - store local URIs and metadata
  const [localMediaFiles, setLocalMediaFiles] = useState<Array<{
    uri: string;
    type: 'image' | 'video';
    name: string;
    mimeType: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocationItem, setSelectedLocationItem] = useState<string | null>(null);
  useEffect(() => {return () => {};
  }, []);
  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {// Optionally reset form when coming back to this screen
      // Uncomment if you want to reset form when navigating back
      // setTitle('');
      // setBodyText('');
      // setMediaUrls([]);
      // setLocation('');
      // setPrivacyType('PUBLIC');
    }, [])
  );
  // Request permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {}
      } catch (error) {}
    })();
  }, []);
  const handlePickImage = async () => {
    try {
      // Check permissions first
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        const newMediaFiles = result.assets.slice(0, 5 - localMediaFiles.length).map((asset) => {
          const fileType = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
          const fileName = asset.fileName || `image_${Date.now()}${asset.uri.endsWith('.png') ? '.png' : '.jpg'}`;
          return {
            uri: asset.uri,
            type: 'image' as const,
            name: fileName,
            mimeType: fileType,
          };
        });
        setLocalMediaFiles([...localMediaFiles, ...newMediaFiles]);
      }
    } catch (error: any) {Alert.alert('Lỗi', error.message || 'Không thể mở thư viện ảnh');
    }
  };
  const handlePickVideo = async () => {
    try {
      // Check permissions first
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện video để chọn video');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false, // Only one video at a time
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileType = asset.mimeType || 'video/mp4';
        const fileName = asset.fileName || `video_${Date.now()}.mp4`;
        // Check if we already have 5 media files
        if (localMediaFiles.length >= 5) {
          Alert.alert('Thông báo', 'Bạn chỉ có thể chọn tối đa 5 media');
          return;
        }
        setLocalMediaFiles([
          ...localMediaFiles,
          {
            uri: asset.uri,
            type: 'video' as const,
            name: fileName,
            mimeType: fileType,
          },
        ]);
      }
    } catch (error: any) {Alert.alert('Lỗi', error.message || 'Không thể mở thư viện video');
    }
  };
  const handleRemoveMedia = (index: number) => {
    setLocalMediaFiles(localMediaFiles.filter((_, i) => i !== index));
  };
  const handleCreatePost = async () => {
    const content = title ? `${title}\n\n${bodyText}`.trim() : bodyText.trim();
    if (!content && localMediaFiles.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung hoặc thêm ảnh/video');
      return;
    }
    if (uploading) {
      Alert.alert('Thông báo', 'Đang upload media, vui lòng đợi...');
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const mediaFile of localMediaFiles) {
        try {
          let uploadResult;
          if (mediaFile.type === 'image') {
            uploadResult = await uploadImage({
              uri: mediaFile.uri,
              name: mediaFile.name,
              type: mediaFile.mimeType,
            });
          } else {
            uploadResult = await uploadVideo({
              uri: mediaFile.uri,
              name: mediaFile.name,
              type: mediaFile.mimeType,
            });
          }
          uploadedUrls.push(uploadResult.fileUrl);
        } catch (error: any) {Alert.alert('Lỗi', `Không thể upload ${mediaFile.type === 'image' ? 'ảnh' : 'video'}: ${mediaFile.name}`);
          setUploading(false);
          return;
        }
      }
      await safeCreatePost.mutateAsync({
        content: content || '📷', // Gửi emoji nếu chỉ có media
        privacyType,
        mediaUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        location: location.trim() || undefined,
      });
      setTitle('');
      setBodyText('');
      setLocalMediaFiles([]);
      setLocation('');
      setPrivacyType('PUBLIC');
      setSelectedLocationItem(null);
      setLocationSearch('');
      Alert.alert('Thành công', 'Đã đăng bài viết', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {Alert.alert('Lỗi', error.message || 'Không thể đăng bài viết');
    } finally {
      setUploading(false);
    }
  };
  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    Alert.alert('Thông báo', 'Đã lưu bản nháp');
  };
  const locationSuggestions = [
    'New York, USA',
    'New Orleans, USA',
    'New Haven, USA',
    'New Rochelle, USA',
    'Newcastle, UK',
    'New Delhi, India',
    'New Brunswick, Canada',
  ];
  const filteredLocations = locationSuggestions.filter((loc) =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const handleLocationSelect = (locationName: string) => {
    setSelectedLocationItem(locationName);
  };
  const handleLocationContinue = () => {
    if (selectedLocationItem) {
      setLocation(selectedLocationItem);
      setShowLocationModal(false);
      setSelectedLocationItem(null);
      setLocationSearch('');
    }
  };
  // Ensure we always have valid values
  const safeColors = colors || Colors.light;
  const safeCreatePost = createPost || {
    mutateAsync: async () => {
      throw new Error('Create post hook not initialized');
    },
    isPending: false,
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#E8F4FD' }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài viết</Text>
          <View style={styles.headerButton} />
        </View>
        <ScrollView 
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}>
            {/* Post Content Card */}
            <View style={styles.postContentCard}>
              {/* Title */}
              <Text style={styles.label}>Tiêu đề</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Nhập tiêu đề..."
                placeholderTextColor="#999999"
                value={title}
                onChangeText={setTitle}
                multiline
              />
              {/* Body Text */}
              <Text style={[styles.label, styles.bodyLabel]}>Nội dung (Tùy chọn)</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="Viết nội dung bài viết của bạn ở đây..."
                placeholderTextColor="#999999"
                value={bodyText}
                onChangeText={setBodyText}
                multiline
                numberOfLines={8}
              />
              {/* Media Icons Row */}
              <View style={styles.mediaIconsRow}>
                <TouchableOpacity
                  style={styles.mediaIconButton}
                  onPress={handlePickImage}
                  disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#666666" />
                  ) : (
                    <Ionicons name="image-outline" size={24} color="#666666" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaIconButton}
                  onPress={handlePickVideo}
                  disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#666666" />
                  ) : (
                    <Ionicons name="videocam-outline" size={24} color="#666666" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaIconButton}>
                  <Ionicons name="calendar-outline" size={24} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaIconButton}>
                  <Ionicons name="musical-notes-outline" size={24} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaIconButton}>
                  <Ionicons name="person-outline" size={24} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.communityButton}>
                  <Text style={styles.communityButtonText}>Cộng đồng</Text>
                </TouchableOpacity>
              </View>
              {/* Media Preview */}
              {localMediaFiles.length > 0 && (
                <View style={styles.mediaPreview}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {localMediaFiles.map((mediaFile, index) => (
                      <View key={index} style={styles.mediaPreviewItem}>
                        {mediaFile.type === 'video' ? (
                          <View style={styles.previewVideoContainer}>
                            <Image 
                              source={{ uri: mediaFile.uri }} 
                              style={styles.previewImage} 
                              resizeMode="cover" 
                            />
                            <View style={styles.previewVideoOverlay}>
                              <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                            </View>
                          </View>
                        ) : (
                          <Image source={{ uri: mediaFile.uri }} style={styles.previewImage} resizeMode="cover" />
                        )}
                        <TouchableOpacity
                          style={styles.removePreviewButton}
                          onPress={() => handleRemoveMedia(index)}>
                          <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  {uploading && (
                    <View style={styles.uploadingIndicator}>
                      <ActivityIndicator size="small" color="#666666" />
                      <Text style={styles.uploadingText}>Đang upload...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            {/* Post Options */}
            <View style={styles.optionsSection}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => setShowLocationModal(true)}>
                <View style={styles.optionLeft}>
                  <Ionicons name="location-outline" size={20} color="#666666" />
                  <Text style={styles.optionText}>
                    {location ? location : 'Thêm địa điểm'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  const options = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
                  const currentIndex = options.indexOf(privacyType);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setPrivacyType(options[nextIndex] as 'PUBLIC' | 'FRIENDS' | 'PRIVATE');
                }}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={privacyType === 'PUBLIC' ? 'globe-outline' : privacyType === 'FRIENDS' ? 'people-outline' : 'lock-closed-outline'}
                    size={20}
                    color="#666666"
                  />
                  <Text style={styles.optionText}>
                    Chia sẻ với {privacyType === 'PUBLIC' ? 'Công khai' : privacyType === 'FRIENDS' ? 'Bạn bè' : 'Riêng tư'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.draftButtonText}>Lưu nháp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!title.trim() && !bodyText.trim() && localMediaFiles.length === 0) && styles.postButtonDisabled
            ]}
            onPress={handleCreatePost}
            disabled={(!title.trim() && !bodyText.trim() && localMediaFiles.length === 0) || safeCreatePost.isPending || uploading}>
            {safeCreatePost.isPending || uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Đăng</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Location Picker Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location</Text>
            </View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm địa điểm..."
                placeholderTextColor="#999999"
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus
              />
            </View>
            {/* Location List */}
            <ScrollView style={styles.locationList} showsVerticalScrollIndicator={false}>
              {filteredLocations.map((loc, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationItem,
                    selectedLocationItem === loc && styles.locationItemSelected,
                  ]}
                  onPress={() => handleLocationSelect(loc)}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={selectedLocationItem === loc ? '#007AFF' : '#666666'}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      selectedLocationItem === loc && styles.locationTextSelected,
                    ]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedLocationItem && styles.continueButtonDisabled,
              ]}
              onPress={handleLocationContinue}
              disabled={!selectedLocationItem}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
// Wrapper component with error boundary
export default function CreatePostScreen() {
  return (
    <CreatePostErrorBoundary>
      <CreatePostScreenContent />
    </CreatePostErrorBoundary>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  keyboardView: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  postContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  bodyLabel: {
    marginTop: Spacing.md,
  },
  titleInput: {
    fontSize: 16,
    color: '#000000',
    paddingVertical: Spacing.xs,
    minHeight: 40,
  },
  bodyInput: {
    fontSize: 15,
    color: '#000000',
    paddingVertical: Spacing.xs,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  mediaIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  communityButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginLeft: 'auto',
  },
  communityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  mediaPreview: {
    marginTop: Spacing.md,
  },
  mediaPreviewItem: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  previewVideoContainer: {
    position: 'relative',
  },
  previewVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  removePreviewButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666666',
  },
  optionsSection: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  draftButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  postButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Location Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Spacing.md,
    maxHeight: '70%',
    minHeight: '60%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 0,
  },
  locationList: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  locationItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  locationText: {
    fontSize: 15,
    color: '#000000',
    flex: 1,
  },
  locationTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});