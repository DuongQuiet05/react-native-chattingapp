import { apiFetch } from './http-client';

export interface RegisterDeviceRequest {
  fcmToken: string;
  deviceId: string;
  deviceType: 'ANDROID' | 'IOS' | 'WEB';
  appVersion?: string;
}

export async function registerDevice(data: RegisterDeviceRequest) {
  return apiFetch<{ success: boolean; message: string }>('/devices/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unregisterDevice(deviceId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/devices/unregister?deviceId=${deviceId}`, {
    method: 'DELETE',
  });
}

