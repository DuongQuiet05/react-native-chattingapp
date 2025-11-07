import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ username?: string }>();
  const { status, signIn } = useAuth();
  const [username, setUsername] = useState(params.username || '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/feed" />;
  }

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!username || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signIn({ username, password });
      // Chuyển đến trang Feed sau khi đăng nhập thành công
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      // Extract error message from different sources
      let errorMessage = '';
      let errorDetails: any = null;
      
      // Try to get message from error.details (response body) - this is where backend error message is
      if (error?.details) {
        errorDetails = error.details;
        if (typeof errorDetails === 'string') {
          try {
            errorDetails = JSON.parse(errorDetails);
          } catch {
            // Not JSON, use as is
          }
        }
        // Backend returns ErrorResponse with 'message' field
        if (errorDetails?.message) {
          errorMessage = errorDetails.message;
        } else if (errorDetails?.error) {
          errorMessage = errorDetails.error;
        }
      }
      
      // Fallback to error.message (which should already contain the message from http-client)
      if (!errorMessage && error?.message) {
        errorMessage = error.message;
      }
      
      // Kiểm tra nếu tài khoản bị chặn (check multiple patterns)
      const blockedPatterns = ['bị chặn', 'bị khóa', 'blocked', 'khóa', 'chặn', 'đã bị'];
      const isBlocked = blockedPatterns.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isBlocked) {
        Alert.alert(
          'Tài khoản đã bị khóa',
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với ADMIN để được hỗ trợ.',
          [
            {
              text: 'Đóng',
              style: 'cancel',
            },
          ]
        );
        setIsSubmitting(false);
        return;
      }
      
      // Kiểm tra các trường hợp đặc biệt khác
      if (errorMessage.includes('not verified') || errorMessage.includes('chưa xác thực')) {
        Alert.alert(
          'Chưa xác thực',
          'Số điện thoại chưa được xác thực. Vui lòng xác thực trước khi đăng nhập.',
          [
            {
              text: 'Đóng',
              style: 'cancel',
            },
          ]
        );
        setIsSubmitting(false);
        return;
      }
      
      // Xử lý các lỗi khác
      let displayMessage = 'Đăng nhập thất bại';
      
      if (error?.status === 401) {
        displayMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác';
      } else if (error?.status === 0) {
        // Network error - server không thể kết nối
        displayMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra:\n- Kết nối mạng\n- Backend đang chạy\n- Địa chỉ API đúng';
      } else if (errorMessage && !errorMessage.match(/^\d{3}\s/)) {
        // Use error message if it's not just a status code
        displayMessage = errorMessage;
      }

      setErrorMessage(displayMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}>
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Đăng nhập
          </ThemedText>
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Tên đăng nhập</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Mật khẩu</ThemedText>
          <TextInput
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            editable={!isSubmitting}
          />
        </View>
        {errorMessage ? (
          <ThemedText style={styles.error}>{errorMessage}</ThemedText>
        ) : null}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
          onPress={handleSubmit}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Đăng nhập</ThemedText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/register')}
          disabled={isSubmitting}>
          <ThemedText style={styles.linkText}>
            Chưa có tài khoản? Đăng ký
          </ThemedText>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    opacity: 0.8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
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
