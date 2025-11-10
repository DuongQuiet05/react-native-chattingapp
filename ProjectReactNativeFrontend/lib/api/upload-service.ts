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
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.name || `image_${Date.now()}.jpg`,
  } as any);
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  const uploadUrl = `${API_BASE_URL}/messages/upload/image`;
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Upload failed: ${response.status}`);
      } catch (e) {
        if (e instanceof Error && e.message.includes('Upload failed')) {
          throw e;
        }
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
    }
    const result = await response.json();
    return result;
  } catch (error) {
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
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
  const token = await getAccessToken();
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
    try {
      const errorJson = JSON.parse(errorText);
    } catch (e) {}
    throw new Error('Failed to upload video');
  }
  const result = await response.json();
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
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
  const token = await getAccessToken();
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
    try {
      const errorJson = JSON.parse(errorText);
    } catch (e) {}
    throw new Error('Failed to upload file');
  }
  const result = await response.json();
  return result;
}