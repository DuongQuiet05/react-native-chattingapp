import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBlockedUsers, useUnblockUser } from '@/hooks/api/use-blocks';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
export default function BlockedUsersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: blockedData, isLoading, refetch } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const blockedUsers = blockedData?.blockedUsers || [];
  const blockedUserIds = blockedData?.blockedUserIds || [];
  const handleUnblock = async (userId: number, userName: string) => {
    Alert.alert('Bỏ chặn', `Bạn có chắc chắn muốn bỏ chặn ${userName}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bỏ chặn',
        style: 'destructive',
        onPress: async () => {
          try {
            await unblockUser.mutateAsync(userId);
            Alert.alert('Thành công', 'Đã bỏ chặn người dùng');
            refetch();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể bỏ chặn người dùng');
          }
        },
      },
    ]);
  };
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Người dùng bị chặn</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        {blockedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.slash" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có người dùng nào bị chặn
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {blockedUsers.map((blockedUser) => (
              <Card key={blockedUser.id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={() => router.push(`/(tabs)/profile/${blockedUser.userId}` as any)}>
                  {blockedUser.avatarUrl ? (
                    <Image
                      source={{ uri: blockedUser.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                      <IconSymbol name="person.fill" size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {blockedUser.displayName || blockedUser.username}
                    </Text>
                    <Text style={[styles.userNote, { color: colors.textSecondary }]}>
                      @{blockedUser.username}
                    </Text>
                    <Text style={[styles.blockedDate, { color: colors.textSecondary }]}>
                      Đã chặn {dayjs(blockedUser.blockedAt).fromNow()}
                    </Text>
                  </View>
                </TouchableOpacity>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleUnblock(blockedUser.userId, blockedUser.displayName || blockedUser.username)}
                  disabled={unblockUser.isPending}>
                  Bỏ chặn
                </Button>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userNote: {
    fontSize: 14,
    marginTop: 2,
  },
  blockedDate: {
    fontSize: 12,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});