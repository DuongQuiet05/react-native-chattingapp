import type { UserSearchResult } from '@/lib/api/friends';
import { getOrCreatePrivateConversation } from '@/lib/api/conversations';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
interface UserSearchItemProps {
  user: UserSearchResult;
  onSendRequest: (userId: number, userName: string) => void;
  onAcceptRequest: (requestId: number) => void;
}
export function UserSearchItem({
  user,
  onSendRequest,
  onAcceptRequest,
}: UserSearchItemProps) {
  const [loadingConversation, setLoadingConversation] = useState(false);
  const handleMessage = async () => {
    try {
      setLoadingConversation(true);
      const conversation = await getOrCreatePrivateConversation(user.id);
      router.push(`/chat/${conversation.id}` as any);
    } catch (error: any) {Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
    } finally {
      setLoadingConversation(false);
    }
  };
  const getStatusColor = () => {
    switch (user.relationshipStatus) {
      case 'FRIEND':
        return '#4CAF50';
      case 'REQUEST_SENT':
        return '#999';
      case 'REQUEST_RECEIVED':
        return '#0a84ff';
      default:
        return '#0a84ff';
    }
  };
  const renderActionButton = () => {
    switch (user.relationshipStatus) {
      case 'STRANGER':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#0a84ff' }]}
            onPress={() => onSendRequest(user.id, user.displayName)}>
            <ThemedText style={styles.buttonText}>Kết bạn</ThemedText>
          </TouchableOpacity>
        );
      case 'FRIEND':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }, loadingConversation && styles.buttonDisabled]}
            onPress={handleMessage}
            disabled={loadingConversation}>
            {loadingConversation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Nhắn tin</ThemedText>
            )}
          </TouchableOpacity>
        );
      case 'REQUEST_SENT':
        return (
          <View style={[styles.button, styles.disabledButton]}>
            <ThemedText style={styles.disabledButtonText}>Đã gửi</ThemedText>
          </View>
        );
      case 'REQUEST_RECEIVED':
        return (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#0a84ff' }]}
            onPress={() => {
              if (user.requestId) {
                onAcceptRequest(user.requestId);
              }
            }}>
            <ThemedText style={styles.buttonText}>Chấp nhận</ThemedText>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };
  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          router.push(`/(tabs)/profile/${user.id}` as any);
        }}>
        <Image
          source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <ThemedText style={styles.displayName}>{user.displayName}</ThemedText>
          <ThemedText style={styles.username}>@{user.username}</ThemedText>
          {user.phoneNumber && (
            <ThemedText style={styles.phoneNumber}>📱 {user.phoneNumber}</ThemedText>
          )}
          {user.mutualFriendsCount > 0 && (
            <ThemedText style={styles.mutualFriends}>
              {user.mutualFriendsCount} bạn chung
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.actionContainer}>{renderActionButton()}</View>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  info: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 13,
    opacity: 0.55,
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 12,
    opacity: 0.5,
  },
  actionContainer: {
    marginLeft: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});