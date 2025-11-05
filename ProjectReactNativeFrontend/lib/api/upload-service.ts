import { API_BASE_URL } from '@/constants/config';
import { getAccessToken } from '@/lib/storage/token-storage';

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  publicId: string;
}

/**
 * Upload ảnh lên server
 */
export async function uploadImage(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  
  // Log để debug
  console.log('📤 Preparing to upload image:', {
    name: file.name,
    type: file.type,
    uri: file.uri.substring(0, 50) + '...', // Chỉ log một phần URI để tránh spam
  });
  
  // React Native FormData format - quan trọng: phải dùng object với uri, type, name
  // @ts-ignore - React Native FormData types are different from web
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.name || `image_${Date.now()}.jpg`,
  } as any);

  const token = await getAccessToken();
  
  if (!token) {
    console.error('❌ No access token found');
    throw new Error('Authentication required');
  }
  
  const uploadUrl = `${API_BASE_URL}/messages/upload/image`;
  console.log('📤 Uploading image to:', uploadUrl);
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // KHÔNG set Content-Type header - React Native sẽ tự động set multipart/form-data với boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload image failed:', response.status, errorText);
      
      // Parse error nếu là JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Error details:', errorJson);
        throw new Error(errorJson.message || `Upload failed: ${response.status}`);
      } catch (e) {
        if (e instanceof Error && e.message.includes('Upload failed')) {
          throw e;
        }
        console.error('❌ Raw error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Image uploaded successfully:', result.fileUrl);
    return result;
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.');
    }
    throw error;
  }
}

/**
 * Upload video lên server
 */
export async function uploadVideo(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  
  console.log('📤 Preparing to upload video:', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
  
  // @ts-ignore - React Native FormData types
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });

  const token = await getAccessToken();
  
  console.log('📤 Uploading video to:', `${API_BASE_URL}/messages/upload/video`);
  
  const response = await fetch(`${API_BASE_URL}/messages/upload/video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Upload video failed:', response.status, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      console.error('❌ Error details:', errorJson);
    } catch (e) {
      console.error('❌ Raw error:', errorText);
    }
    
    throw new Error('Failed to upload video');
  }

  const result = await response.json();
  console.log('✅ Video uploaded:', result.fileUrl);
  return result;
}

/**
 * Upload file tài liệu lên server
 */
export async function uploadFile(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  
  console.log('📤 Preparing to upload file:', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
  
  // @ts-ignore - React Native FormData types
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });

  const token = await getAccessToken();
  
  console.log('📤 Uploading file to:', `${API_BASE_URL}/messages/upload/file`);
  
  const response = await fetch(`${API_BASE_URL}/messages/upload/file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Upload file failed:', response.status, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      console.error('❌ Error details:', errorJson);
    } catch (e) {
      console.error('❌ Raw error:', errorText);
    }
    
    throw new Error('Failed to upload file');
  }

  const result = await response.json();
  console.log('✅ File uploaded:', result.fileUrl);
  return result;
}
