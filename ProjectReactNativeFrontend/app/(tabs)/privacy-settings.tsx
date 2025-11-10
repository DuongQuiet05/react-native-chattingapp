import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPrivacySettings, updatePrivacySettings, type PrivacySettings } from '@/lib/api/friends';
export default function PrivacySettingsScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getPrivacySettings();
      setSettings(data);
    } catch (error) {Alert.alert('Lỗi', 'Không thể tải cài đặt quyền riêng tư');
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = async (key: keyof Omit<PrivacySettings, 'userId'>, value: boolean) => {
    if (!settings) return;
    const previousSettings = { ...settings };
    // Optimistic update
    setSettings({ ...settings, [key]: value });
    setSaving(true);
    try {
      const updated = await updatePrivacySettings({ [key]: value });
      setSettings(updated);
    } catch (error) {// Revert on error
      setSettings(previousSettings);
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  if (!settings) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={64} color="#ff9500" />
          <ThemedText style={styles.errorText}>Không thể tải cài đặt</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
            <ThemedText style={styles.retryText}>Thử lại</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0a84ff" />
          </TouchableOpacity>
          <ThemedText type="title">Quyền riêng tư</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.content}>
          {/* Section 1: Tìm kiếm */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tìm kiếm</ThemedText>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>
                  Cho phép tìm kiếm bằng số điện thoại
                </ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Người khác có thể tìm thấy bạn bằng số điện thoại của bạn
                </ThemedText>
              </View>
              <Switch
                value={settings.allowFindByPhone}
                onValueChange={(value) => handleToggle('allowFindByPhone', value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#34c759' }}
                thumbColor={colorScheme === 'dark' ? '#f4f3f4' : '#fff'}
              />
            </View>
          </View>
          {/* Section 2: Kết bạn */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Kết bạn</ThemedText>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>
                  Nhận lời mời từ người lạ
                </ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Cho phép nhận lời mời kết bạn từ người không có bạn chung
                </ThemedText>
              </View>
              <Switch
                value={settings.allowFriendRequestFromStrangers}
                onValueChange={(value) => handleToggle('allowFriendRequestFromStrangers', value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#34c759' }}
                thumbColor={colorScheme === 'dark' ? '#f4f3f4' : '#fff'}
              />
            </View>
          </View>
          {/* Section 3: Thông tin cá nhân */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Thông tin cá nhân</ThemedText>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>
                  Hiển thị số điện thoại cho bạn bè
                </ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Bạn bè của bạn có thể xem số điện thoại của bạn
                </ThemedText>
              </View>
              <Switch
                value={settings.showPhoneToFriends}
                onValueChange={(value) => handleToggle('showPhoneToFriends', value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#34c759' }}
                thumbColor={colorScheme === 'dark' ? '#f4f3f4' : '#fff'}
              />
            </View>
          </View>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#0a84ff" />
            <ThemedText style={styles.infoText}>
              Các cài đặt này giúp bạn kiểm soát ai có thể tìm thấy và kết nối với bạn.
              Bạn có thể thay đổi bất cứ lúc nào.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0a84ff',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#0a84ff',
  },
});