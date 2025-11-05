import React, { useState } from 'react';
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/api/upload-service';

const { width } = Dimensions.get('window');

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const createPost = useCreatePost();
  
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [privacyType, setPrivacyType] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocationItem, setSelectedLocationItem] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        try {
          const uploadedUrls: string[] = [];
          
          for (const asset of result.assets.slice(0, 5)) {
            const fileType = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
            const fileName = asset.fileName || `image_${Date.now()}${asset.uri.endsWith('.png') ? '.png' : '.jpg'}`;
            
            const uploadResult = await uploadImage({
              uri: asset.uri,
              name: fileName,
              type: fileType,
            });
            uploadedUrls.push(uploadResult.fileUrl);
          }
          
          setMediaUrls([...mediaUrls, ...uploadedUrls]);
        } catch (error: any) {
          Alert.alert('Lỗi', 'Không thể upload ảnh');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    const content = title ? `${title}\n\n${bodyText}`.trim() : bodyText.trim();
    
    // API yêu cầu content không được để trống
    if (!content && mediaUrls.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung hoặc thêm ảnh');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content || '📷', // Gửi emoji nếu chỉ có media
        privacyType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        location: location.trim() || undefined,
      });
      
      Alert.alert('Thành công', 'Đã đăng bài viết', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng bài viết');
    }
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    Alert.alert('Thông báo', 'Đã lưu bản nháp');
  };

  // Mock location suggestions - có thể thay bằng API sau
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView 
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}>
            {/* Post Content Card */}
            <View style={styles.postContentCard}>
              {/* Title */}
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter title..."
                placeholderTextColor="#999999"
                value={title}
                onChangeText={setTitle}
                multiline
              />

              {/* Body Text */}
              <Text style={[styles.label, styles.bodyLabel]}>Body Text (Optional)</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="Write your post content here..."
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
                  <Text style={styles.communityButtonText}>Community</Text>
                </TouchableOpacity>
              </View>

              {/* Media Preview */}
              {mediaUrls.length > 0 && (
                <View style={styles.mediaPreview}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {mediaUrls.map((url, index) => (
                      <View key={index} style={styles.mediaPreviewItem}>
                        <Image source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.removePreviewButton}
                          onPress={() => handleRemoveImage(index)}>
                          <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
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
                    {location ? location : 'Add Location'}
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
                    Share Post to {privacyType === 'PUBLIC' ? 'Public' : privacyType === 'FRIENDS' ? 'Friends' : 'Private'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!title.trim() && !bodyText.trim() && mediaUrls.length === 0) && styles.postButtonDisabled
            ]}
            onPress={handleCreatePost}
            disabled={(!title.trim() && !bodyText.trim() && mediaUrls.length === 0) || createPost.isPending || uploading}>
            {createPost.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
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
                placeholder="Search location..."
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
  removePreviewButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000000',
    borderRadius: 12,
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
});