import { uploadFile, uploadImage, uploadVideo, type FileUploadResponse } from '@/lib/api/upload-service';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  /**
   * Chọn và upload ảnh từ thư viện
   */
  const pickAndUploadImage = async (): Promise<FileUploadResponse | null> => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
        return null;
      }
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (result.canceled) {
        return null;
      }
      const asset = result.assets[0];setIsUploading(true);
      setUploadProgress(0);
      // Upload to server
      const uploadResult = await uploadImage({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setUploadProgress(100);
      setIsUploading(false);
      return uploadResult;
    } catch (error) {Alert.alert('Lỗi', 'Không thể upload ảnh');
      setIsUploading(false);
      return null;
    }
  };
  /**
   * Chụp ảnh và upload
   */
  const takeAndUploadPhoto = async (): Promise<FileUploadResponse | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      if (result.canceled) {
        return null;
      }
      const asset = result.assets[0];
      setIsUploading(true);
      const uploadResult = await uploadImage({
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setIsUploading(false);
      return uploadResult;
    } catch (error) {Alert.alert('Lỗi', 'Không thể chụp ảnh');
      setIsUploading(false);
      return null;
    }
  };
  /**
   * Chọn và upload video
   */
  const pickAndUploadVideo = async (): Promise<FileUploadResponse | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện video');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
      });
      if (result.canceled) {
        return null;
      }
      const asset = result.assets[0];
      setIsUploading(true);
      const uploadResult = await uploadVideo({
        uri: asset.uri,
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: asset.mimeType || 'video/mp4',
      });
      setIsUploading(false);
      return uploadResult;
    } catch (error) {Alert.alert('Lỗi', 'Không thể upload video');
      setIsUploading(false);
      return null;
    }
  };
  /**
   * Chọn và upload file tài liệu
   */
  const pickAndUploadDocument = async (): Promise<FileUploadResponse | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return null;
      }
      const file = result.assets[0];
      setIsUploading(true);
      const uploadResult = await uploadFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      setIsUploading(false);
      return uploadResult;
    } catch (error) {Alert.alert('Lỗi', 'Không thể upload file');
      setIsUploading(false);
      return null;
    }
  };
  return {
    isUploading,
    uploadProgress,
    pickAndUploadImage,
    takeAndUploadPhoto,
    pickAndUploadVideo,
    pickAndUploadDocument,
  };
}