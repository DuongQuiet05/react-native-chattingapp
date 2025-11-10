import { useMutation } from '@tanstack/react-query';
import { registerDevice, unregisterDevice, type RegisterDeviceRequest } from '@/lib/api/devices';
export function useRegisterDevice() {
  return useMutation({
    mutationFn: (data: RegisterDeviceRequest) => registerDevice(data),
  });
}
export function useUnregisterDevice() {
  return useMutation({
    mutationFn: (deviceId: string) => unregisterDevice(deviceId),
  });
}