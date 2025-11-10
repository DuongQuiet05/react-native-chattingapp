import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateStory } from '@/hooks/api/use-stories';
import { uploadImage, uploadVideo } from '@/lib/api/upload-service';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/auth-context';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const PREVIEW_HEIGHT = height * 0.6;

export default function CreateStoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createStory = useCreateStory();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<Video>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null);
    }
  };
  
  const takeVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedImage && !selectedVideo) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh hoặc video');
      return;
    }
    try {
      setIsUploading(true);
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      if (selectedImage) {
        const uploadResult = await uploadImage({
          uri: selectedImage,
          name: `story_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        imageUrl = uploadResult.fileUrl;
      }
      if (selectedVideo) {
        const uploadResult = await uploadVideo({
          uri: selectedVideo,
          name: `story_${Date.now()}.mp4`,
          type: 'video/mp4',
        });
        videoUrl = uploadResult.fileUrl;
      }
      await createStory.mutateAsync({
        imageUrl,
        videoUrl,
        textOverlay: textOverlay || undefined,
        musicTitle: musicTitle || undefined,
      });
      router.back();
    } catch (error) {
        Alert.alert('Lỗi', 'Không thể tạo story');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Story</Text>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading || (!selectedImage && !selectedVideo)}
          style={styles.publishButton}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mediaContainer}>
          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.mediaPreview} resizeMode="cover" />
              {textOverlay && (
                <View style={styles.textOverlayPreview}>
                  <Text style={styles.textOverlayPreviewText}>{textOverlay}</Text>
                </View>
              )}
            </View>
          )}
          {selectedVideo && (
            <View style={styles.previewContainer}>
              <Video
                ref={videoRef}
                source={{ uri: selectedVideo }}
                style={styles.videoPreview}
                resizeMode={ResizeMode.COVER}
                shouldPlay={true}
                isLooping={true}
                isMuted={false}
              />
              {textOverlay && (
                <View style={styles.textOverlayPreview}>
                  <Text style={styles.textOverlayPreviewText}>{textOverlay}</Text>
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'transparent']}
                style={styles.videoGradient}
              />
            </View>
          )}
          {!selectedImage && !selectedVideo && (
            <View style={styles.placeholder}>
              <Ionicons name="images-outline" size={64} color="#666" />
              <Text style={styles.placeholderText}>Select media for your story</Text>
            </View>
          )}
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#007AFF" />
            <Text style={styles.controlText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#007AFF" />
            <Text style={styles.controlText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={pickVideo}>
            <Ionicons name="videocam" size={24} color="#007AFF" />
            <Text style={styles.controlText}>Video</Text>
          </TouchableOpacity>
        </View>
        {(selectedImage || selectedVideo) && (
          <View style={styles.previewInfo}>
            <Text style={styles.previewInfoText}>
              ✓ Preview: {selectedImage ? 'Ảnh' : 'Video'} đã được chọn
            </Text>
            <Text style={styles.previewInfoSubtext}>
              Bạn có thể thêm text overlay và music title bên dưới
            </Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Văn bản hiển thị trên story</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Thêm văn bản vào story của bạn..."
            placeholderTextColor="#999"
            value={textOverlay}
            onChangeText={setTextOverlay}
            multiline
            maxLength={100}
          />
          {textOverlay && (selectedImage || selectedVideo) && (
            <Text style={styles.previewHint}>✓ Text sẽ hiển thị trên story như preview ở trên</Text>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tên nhạc (Tùy chọn)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ví dụ: Lofi Mama - My Little Buquet"
            placeholderTextColor="#999"
            value={musicTitle}
            onChangeText={setMusicTitle}
            maxLength={100}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  publishText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    backgroundColor: '#000',
    marginBottom: 20,
    borderRadius: 0,
    overflow: 'hidden',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  textOverlayPreview: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  textOverlayPreviewText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    marginTop: 12,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewHint: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  previewInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  previewInfoText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewInfoSubtext: {
    color: '#81C784',
    fontSize: 12,
  },
});

