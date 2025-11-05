import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { router, useLocalSearchParams } from 'expo-router';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/firebase/config';
import { verifyOTP as verifyOTPAPI } from '@/lib/api/auth';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams<{ phoneNumber: string; username: string }>();
  const { phoneNumber, username } = params;

  const recaptchaVerifier = useRef(null);
  const [verificationId, setVerificationId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // 1. Gửi OTP qua Firebase
  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Lỗi', 'Không tìm thấy số điện thoại');
      return;
    }

    setLoading(true);
    try {
      // Chuyển đổi số điện thoại sang format quốc tế
      let internationalPhone = phoneNumber;
      if (phoneNumber.startsWith('0')) {
        internationalPhone = '+84' + phoneNumber.substring(1);
      }

      console.log('📞 Gửi OTP đến:', internationalPhone);

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        internationalPhone,
        recaptchaVerifier.current as any
      );

      setVerificationId(verificationId);
      setOtpSent(true);
      console.log('✅ OTP đã được gửi!');
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn!');
    } catch (error: any) {
      console.error('❌ Lỗi gửi OTP:', error);
      
      // Xử lý lỗi billing của Firebase
      if (error.code === 'auth/billing-not-enabled') {
        Alert.alert(
          'Firebase Billing Chưa Được Bật',
          'Để sử dụng tính năng xác thực số điện thoại, bạn cần bật billing trong Firebase Console.\n\n' +
          'Giải pháp:\n' +
          '1. Vào Firebase Console (https://console.firebase.google.com)\n' +
          '2. Chọn project của bạn\n' +
          '3. Vào Settings > Usage and billing\n' +
          '4. Bật billing và thêm phương thức thanh toán\n\n' +
          'Lưu ý: Firebase có tier miễn phí cho Phone Authentication, nhưng vẫn cần billing được bật.\n\n' +
          'Hoặc bạn có thể sử dụng số điện thoại test trong development mode.',
          [
            {
              text: 'Hiểu rồi',
              style: 'default',
            },
          ]
        );
      } else if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Lỗi', 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.');
      } else {
        Alert.alert('Lỗi', 'Không thể gửi OTP: ' + (error.message || error.code || 'Lỗi không xác định'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Xác thực OTP
  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP gồm 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      // Verify với Firebase
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();

      console.log('✅ Firebase xác thực thành công!');

      // Gửi lên Backend để xác nhận
      const response = await verifyOTPAPI({
        phoneNumber,
        otpCode,
        idToken,
      });

      console.log('✅ Backend xác thực thành công:', response);

      if (response.success) {
        Alert.alert(
          'Xác thực thành công!',
          'Bạn có thể đăng nhập ngay bây giờ.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                router.replace({
                  pathname: '/(auth)/login',
                  params: { username },
                } as any);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Lỗi verify OTP:', error);

      const errorMsg =
        error.response?.data?.message || error.message || 'Mã OTP không đúng';

      Alert.alert('Xác thực thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}>
        {/* reCAPTCHA - BẮT BUỘC */}
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
          attemptInvisibleVerification={true}
        />

      <ThemedView style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Xác thực OTP
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Số điện thoại: {phoneNumber}
        </ThemedText>

        {!otpSent ? (
          <>
            <ThemedText style={styles.description}>
              Nhấn nút bên dưới để nhận mã OTP qua SMS
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={sendOTP}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Gửi mã OTP</ThemedText>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Mã OTP (6 chữ số)</ThemedText>
              <TextInput
                placeholder="000000"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={verifyOTP}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Xác thực OTP</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={sendOTP}
              disabled={loading}>
              <ThemedText style={styles.linkText}>Gửi lại mã OTP</ThemedText>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
          disabled={loading}>
          <ThemedText style={styles.linkText}>Quay lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    gap: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#0a84ff',
    fontSize: 14,
  },
});
