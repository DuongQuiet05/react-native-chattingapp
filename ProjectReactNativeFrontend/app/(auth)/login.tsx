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
    return <Redirect href="/(tabs)" />;
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
    } catch (error: any) {
      console.error('Đăng nhập thất bại', error);

      // Xử lý thông báo lỗi thân thiện với người dùng
      let message = 'Đăng nhập thất bại';
      
      // Kiểm tra status code từ error
      if (error?.status === 401) {
        // Lỗi 401 - Thông tin đăng nhập không đúng
        message = 'Tên đăng nhập hoặc mật khẩu không chính xác';
      } else if (error?.status === 0) {
        // Lỗi kết nối
        message = 'Không thể kết nối tới máy chủ';
      } else if (error?.message) {
        // Kiểm tra các trường hợp đặc biệt khác
        if (error.message.includes('not verified') || error.message.includes('chưa xác thực')) {
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
        
        // Nếu có message cụ thể từ server (không phải lỗi 401)
        if (error.status !== 401 && !error.message.match(/^\d{3}/)) {
          message = error.message;
        }
      }
      
      if (error?.details) {
        console.error('Chi tiết lỗi:', error.details);
      }

      setErrorMessage(message);
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
