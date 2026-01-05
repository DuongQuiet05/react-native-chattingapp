import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

import { register } from '@/lib/api/auth';
import { ThemedView } from '@/components/themed-view';
export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const handleRegister = async () => {
    // Validation
    if (!username || !phoneNumber || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }
    // Validate phone format (0339533380 or +84339533380)
    const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. VD: 0339533380');
      return;
    }
    setLoading(true);
    try {
      const response = await register({
        username,
        phoneNumber,
        password,
        confirmPassword,
        displayName: displayName || username,
      });Alert.alert(
        'Thành công',
        'Tài khoản đã được tạo! Vui lòng đăng nhập để tiếp tục.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ]

      );
    } catch (error: any) {const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Không thể kết nối tới server';
      Alert.alert('Đăng ký thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Đăng ký tài khoản
          </ThemedText>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Tên đăng nhập *</ThemedText>
            <TextInput
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
              editable={!loading}
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Số điện thoại *</ThemedText>
            <TextInput
              placeholder="0339533380"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
              editable={!loading}
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Tên hiển thị</ThemedText>
            <TextInput
              placeholder="Nhập tên hiển thị"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              editable={!loading}
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Mật khẩu *</ThemedText>
            <TextInput
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              editable={!loading}
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Xác nhận mật khẩu *</ThemedText>
            <TextInput
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={handleRegister}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Đăng ký</ThemedText>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}>
            <ThemedText style={styles.linkText}>
              Đã có tài khoản? Đăng nhập
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    gap: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
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
    fontSize: 16,
    color: '#fff',
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
    fontSize: 14,
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