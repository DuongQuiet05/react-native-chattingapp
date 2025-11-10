export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.2.8:8080/api';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://192.168.2.8:8080/ws';
// Auth API Endpoints
export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  SEND_OTP: `${API_BASE_URL}/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  LOGIN: `${API_BASE_URL}/auth/login`,
};