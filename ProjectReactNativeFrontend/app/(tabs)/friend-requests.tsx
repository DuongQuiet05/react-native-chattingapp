import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    acceptFriendRequest,
    getReceivedFriendRequests,
    rejectFriendRequest,
    type FriendRequest,
} from '@/lib/api/friends';
dayjs.extend(relativeTime);
dayjs.locale('vi');
export default function FriendRequestsScreen() {
  const colorScheme = useColorScheme();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const loadRequests = useCallback(async () => {
    try {
      const data = await getReceivedFriendRequests();
      setRequests(data);
    } catch (error) {Alert.alert('Lỗi', 'Không thể tải danh sách lời mời kết bạn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };
  const handleAccept = async (requestId: number) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn!');
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {Alert.alert('Lỗi', 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };
  const handleReject = async (requestId: number) => {
    Alert.alert(
      'Từ chối lời mời',
      'Bạn có chắc muốn từ chối lời mời kết bạn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(requestId));
            try {
              await rejectFriendRequest(requestId);
              // Remove from list
              setRequests(prev => prev.filter(r => r.id !== requestId));
            } catch (error) {Alert.alert('Lỗi', 'Không thể từ chối lời mời. Vui lòng thử lại.');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };
  const renderItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingIds.has(item.id);
    return (
      <ThemedView style={styles.requestItem}>
        <Image
          source={{ uri: item.sender.avatarUrl || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <ThemedText style={styles.senderName}>
            {item.sender.displayName}
          </ThemedText>
          {item.message && (
            <ThemedText style={styles.message} numberOfLines={2}>
              {item.message}
            </ThemedText>
          )}
          <ThemedText style={styles.time}>
            {dayjs(item.createdAt).fromNow()}
          </ThemedText>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleAccept(item.id)}
              disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <ThemedText style={styles.acceptButtonText}>Chấp nhận</ThemedText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleReject(item.id)}
              disabled={isProcessing}>
              <Ionicons name="close" size={18} color="#333" />
              <ThemedText style={styles.rejectButtonText}>Từ chối</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
  };
  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="people-outline"
          size={64}
          color={colorScheme === 'dark' ? '#666' : '#ccc'}
        />
        <ThemedText style={styles.emptyText}>
          Không có lời mời kết bạn nào
        </ThemedText>
      </View>
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Lời mời kết bạn</ThemedText>
          {requests.length > 0 && (
            <ThemedText style={styles.count}>({requests.length})</ThemedText>
          )}
        </View>
        {/* List */}
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={requests.length === 0 ? styles.emptyContainer : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  count: {
    marginLeft: 8,
    opacity: 0.6,
  },
  requestItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  requestInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#0a84ff',
  },
  rejectButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});