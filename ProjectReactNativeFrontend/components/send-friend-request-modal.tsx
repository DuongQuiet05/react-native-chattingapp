import { getOrCreatePrivateConversation } from '@/lib/api/conversations';
import { sendFriendRequest } from '@/lib/api/friends';
import { sendMessage } from '@/lib/api/messages';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
interface SendFriendRequestModalProps {
  visible: boolean;
  recipientId: number;
  recipientName: string;
  onClose: () => void;
  onSuccess: () => void;
}
export function SendFriendRequestModal({
  visible,
  recipientId,
  recipientName,
  onClose,
  onSuccess,
}: SendFriendRequestModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    setLoading(true);
    try {
      await sendFriendRequest({
        receiverId: recipientId,
        message: message.trim() || undefined,
      });
      if (message.trim()) {
        try {// Tạo hoặc lấy conversation với người này
          const conversation = await getOrCreatePrivateConversation(recipientId);// Gửi tin nhắn đầu tiên
          await sendMessage({
            conversationId: conversation.id,
            content: message.trim(),
            messageType: 'TEXT',
          });} catch (conversationError) {// Không báo lỗi cho user vì lời mời kết bạn đã gửi thành công
        }
      }
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn!');
      setMessage('');
      onSuccess();
      onClose();
    } catch (error: any) {let errorMessage = 'Không thể gửi lời mời kết bạn';
      if (error?.details?.message) {
        errorMessage = error.details.message;
      } else if (error?.message) {
        if (error.message.includes('Already friends')) {
          errorMessage = 'Bạn đã là bạn bè với người này rồi';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'Bạn đã gửi lời mời cho người này rồi';
        } else if (error.message.includes('mutual friends')) {
          errorMessage = 'Người dùng này chỉ chấp nhận lời mời từ bạn chung';
        }
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    if (!loading) {
      setMessage('');
      onClose();
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <ThemedView style={styles.container}>
              <ThemedText type="subtitle" style={styles.title}>
                Gửi lời mời kết bạn
              </ThemedText>
              <ThemedText style={styles.recipient}>
                Đến: {recipientName}
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Tin nhắn kèm theo (tùy chọn)"
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={150}
                editable={!loading}
                textAlignVertical="top"
              />
              <ThemedText style={styles.charCount}>
                {message.length}/150
              </ThemedText>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={loading}>
                  <ThemedText style={styles.cancelButtonText}>Hủy</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.sendButton, loading && styles.buttonDisabled]}
                  onPress={handleSend}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.sendButtonText}>Gửi</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  recipient: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  sendButton: {
    backgroundColor: '#0a84ff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});