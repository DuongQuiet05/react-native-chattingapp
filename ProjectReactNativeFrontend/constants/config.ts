import { Platform } from 'react-native';
import Constants from 'expo-constants';


function getDevServerIP(): string {
  // console.log('🔍 [CONFIG] Bắt đầu phát hiện IP của dev server...');
  

  const debuggerHost = Constants.expoConfig?.hostUri;
  // console.log('📋 [CONFIG] Constants.expoConfig?.hostUri =', debuggerHost);
  
  if (debuggerHost) {

    const ip = debuggerHost.split(':')[0];
    // console.log('✅ [CONFIG] Đã tách được IP:', ip);
    // console.log('🎯 [CONFIG] Sẽ sử dụng IP này để kết nối backend');
    return ip;
  }
  

  // console.warn('⚠️ [CONFIG] Không tìm thấy hostUri, sử dụng localhost');
  return 'localhost';
}


const DEV_SERVER_IP = getDevServerIP();
const BACKEND_PORT = '8080';


export const API_BASE_URL = `http://${DEV_SERVER_IP}:${BACKEND_PORT}/api`;
export const WS_BASE_URL = `ws://${DEV_SERVER_IP}:${BACKEND_PORT}/ws`;


export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  SEND_OTP: `${API_BASE_URL}/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  LOGIN: `${API_BASE_URL}/auth/login`,
};
  

if (__DEV__) {
  // console.log('🌐 Auto-detected Dev Server IP:', DEV_SERVER_IP);
  // console.log('📡 API Base URL:', API_BASE_URL);
  // console.log('🔌 WebSocket URL:', WS_BASE_URL);
}