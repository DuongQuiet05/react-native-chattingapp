import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Cấu hình Firebase - Thay thế bằng thông tin từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDUB_zb_7Z3WLbeCxw04Y6ga2RsDlY04q0",
  authDomain: "zalo-chat-app-17aa0.firebaseapp.com",
  projectId: "zalo-chat-app-17aa0",
  storageBucket: "zalo-chat-app-17aa0.firebasestorage.app",
  messagingSenderId: "242196662865",
  appId: "1:242196662865:web:531441107cb3bd7bf88670",
  measurementId: "G-34S7CB5V65"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Authentication
// Note: Firebase Auth với @react-native-async-storage/async-storage v1.23.1 đã cài
// Firebase sẽ tự động phát hiện và sử dụng nó cho persistence
// Warning sẽ hiển thị nhưng app vẫn hoạt động bình thường
export const auth = getAuth(app);

export default app;
