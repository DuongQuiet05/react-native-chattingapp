import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

import { MessageItem } from '@/components/message-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useConversationDetail } from '@/hooks/api/use-conversation-detail';
import { conversationQueryKeys } from '@/hooks/api/use-conversations';
import { messageQueryKeys, useMessages, useSendMessage } from '@/hooks/api/use-messages';
import { useFileUpload } from '@/hooks/use-file-upload';
import type { ConversationDetail, ConversationSummary } from '@/lib/api/conversations';
import type { MessageDto } from '@/lib/api/messages';
import { markConversationAsRead } from '@/lib/api/messages';
import { useStomp } from '@/providers/stomp-provider';
export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const numericId = useMemo(() => Number(conversationId), [conversationId]);
  const flatListRef = useRef<FlatList<MessageDto>>(null);
  const navigation = useNavigation();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { connected, subscribe, sendMessage: sendMessageWS, sendTypingIndicator } = useStomp();
  // Thêm state để force re-render khi có message mới
  const [messageUpdateKey, setMessageUpdateKey] = useState(0);
  // Thêm local state để lưu messages và sync với React Query
  const [localMessages, setLocalMessages] = useState<MessageDto[]>([]);
  const lastSyncMessageIdRef = useRef<number | null>(null);

  const {
    data: messages,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useMessages(numericId, Number.isFinite(numericId));
  const { data: conversationDetail } = useConversationDetail(numericId, Number.isFinite(numericId));
  
  // Sử dụng useMemo để tạo derived state từ localMessages để đảm bảo reference thay đổi
  // Phải đặt TRƯỚC các useEffect để tuân thủ Rules of Hooks
  const displayMessages = useMemo(() => {
    const msgs = localMessages.length > 0 ? localMessages : (messages ?? []);
    console.log('🔄 [Chat] Display messages updated, count:', msgs.length);
    return msgs;
  }, [localMessages, messages]);
  
  // Sync messages từ React Query vào local state chỉ khi:
  // 1. localMessages rỗng (lần đầu mount)
  // 2. Hoặc khi refetch từ API (không phải từ WebSocket update)
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      // Chỉ sync nếu localMessages rỗng hoặc nếu có tin nhắn mới từ API
      if (localMessages.length === 0) {
        console.log('📥 [Chat] Initial sync: Loading messages from API');
        setLocalMessages(messages);
        if (messages.length > 0) {
          lastSyncMessageIdRef.current = messages[messages.length - 1]?.id || null;
        }
      } else {
        // Kiểm tra xem có tin nhắn mới từ API không (không phải từ WebSocket)
        const lastMessageId = messages[messages.length - 1]?.id;
        if (lastMessageId && lastMessageId !== lastSyncMessageIdRef.current && lastSyncMessageIdRef.current !== null) {
          // Có tin nhắn mới từ API, sync lại
          console.log('📥 [Chat] New messages from API, syncing...');
          setLocalMessages(messages);
          lastSyncMessageIdRef.current = lastMessageId;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const sendMessageMutation = useSendMessage(numericId);
  
  const {
    isUploading,
    pickAndUploadImage,
    takeAndUploadPhoto,
    pickAndUploadVideo,
    pickAndUploadDocument,
  } = useFileUpload();

  // Ref để lưu subscription callback
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      console.log('⚠️ [Chat] Invalid conversation ID:', conversationId);
      return;
    }

    if (!connected) {
      console.log('⚠️ [Chat] WebSocket not connected yet, waiting...');
      // Cleanup subscription nếu có
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      return;
    }

    const destination = `/topic/conversations/${numericId}`;
    console.log('🔔 [Chat] Setting up subscription for conversation:', numericId);
    console.log('🔔 [Chat] Current localMessages count:', localMessages.length);
    console.log('🔔 [Chat] Current user ID:', user?.id);

    // Unsubscribe subscription cũ nếu có
    if (subscriptionRef.current) {
      console.log('🔕 [Chat] Unsubscribing from previous subscription');
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Setup subscription với callback
    const unsubscribe = subscribe(destination, (message) => {
      try {
        const rawPayload = JSON.parse(message.body);
        console.log('📬 [Chat] Received WebSocket message:', rawPayload);
        console.log('📬 [Chat] Message action:', rawPayload.action);
        console.log('📬 [Chat] Message ID:', rawPayload.id);
        
        // Xử lý theo action type
        switch (rawPayload.action) {
          case 'SEND': {
            // Transform message từ backend format sang frontend format
            const payload: MessageDto = {
              id: rawPayload.id,
              conversationId: rawPayload.conversationId,
              sender: {
                id: rawPayload.senderId,
                username: rawPayload.senderName,
                displayName: rawPayload.senderName,
                avatarUrl: rawPayload.senderAvatar || undefined,
              },
              content: rawPayload.content,
              messageType: rawPayload.messageType,
              sentAt: rawPayload.sentAt,
              receiptStatus: rawPayload.receiptStatus,
              fileUrl: rawPayload.fileUrl,
              fileName: rawPayload.fileName,
              fileSize: rawPayload.fileSize,
              fileType: rawPayload.fileType,
              thumbnailUrl: rawPayload.thumbnailUrl,
            };

            console.log('📬 [Chat] Updating cache with new message:', payload.id);

            // Update React Query cache
            queryClient.setQueryData<MessageDto[] | undefined>(
              messageQueryKeys.list(numericId),
              (previous) => {
                if (!previous) {
                  console.log('📬 [Chat] No previous messages, creating new array');
                  return [payload];
                }

                // Kiểm tra xem message đã tồn tại chưa
                const exists = previous.some((item) => item.id === payload.id);
                if (exists) {
                  console.log('📬 [Chat] Message already exists, updating:', payload.id);
                  // Update existing message - tạo array mới hoàn toàn
                  const updated = previous.map((item) => (item.id === payload.id ? payload : item));
                  // Sắp xếp lại theo sentAt để đảm bảo thứ tự đúng
                  updated.sort((a, b) => {
                    const dateA = new Date(a.sentAt).getTime();
                    const dateB = new Date(b.sentAt).getTime();
                    return dateA - dateB;
                  });
                  return updated;
                }

                console.log('📬 [Chat] Adding new message to array');
                // Thêm message mới và sắp xếp lại theo sentAt
                // Tạo array mới hoàn toàn để đảm bảo React Query nhận biết thay đổi
                const updated = [...previous, payload];
                updated.sort((a, b) => {
                  const dateA = new Date(a.sentAt).getTime();
                  const dateB = new Date(b.sentAt).getTime();
                  return dateA - dateB;
                });
                return updated;
              },
            );

            // Cập nhật local state ngay lập tức để UI re-render
            // Dùng functional update để đảm bảo luôn nhận được state mới nhất
            setLocalMessages((prev) => {
              console.log('📬 [Chat] Current localMessages count:', prev.length);
              console.log('📬 [Chat] New message ID:', payload.id);
              console.log('📬 [Chat] New message sender ID:', payload.sender.id);
              console.log('📬 [Chat] Current user ID:', user?.id);
              
              const exists = prev.some((item) => item.id === payload.id);
              if (exists) {
                console.log('📬 [Chat] Message already in local state, updating');
                const updated = prev.map((item) => (item.id === payload.id ? payload : item));
                updated.sort((a, b) => {
                  const dateA = new Date(a.sentAt).getTime();
                  const dateB = new Date(b.sentAt).getTime();
                  return dateA - dateB;
                });
                console.log('📬 [Chat] Local state updated, new count:', updated.length);
                console.log('📬 [Chat] Updated messages IDs:', updated.map(m => m.id));
                // Cập nhật lastSyncMessageIdRef để tránh bị sync lại từ API
                if (updated.length > 0) {
                  lastSyncMessageIdRef.current = updated[updated.length - 1]?.id || null;
                }
                return updated;
              }
              console.log('📬 [Chat] Adding new message to local state');
              const updated = [...prev, payload];
              updated.sort((a, b) => {
                const dateA = new Date(a.sentAt).getTime();
                const dateB = new Date(b.sentAt).getTime();
                return dateA - dateB;
              });
              console.log('📬 [Chat] Local state updated, new count:', updated.length);
              console.log('📬 [Chat] Updated messages IDs:', updated.map(m => m.id));
              // Cập nhật lastSyncMessageIdRef để tránh bị sync lại từ API
              if (updated.length > 0) {
                lastSyncMessageIdRef.current = updated[updated.length - 1]?.id || null;
              }
              return updated;
            });
            
            // Force re-render bằng cách update key ngay lập tức
            setMessageUpdateKey(prev => {
              const newKey = prev + 1;
              console.log('📬 [Chat] Update key changed:', newKey);
              return newKey;
            });
            
            // Force scroll ngay lập tức
            setTimeout(() => {
              console.log('📬 [Chat] Scrolling to end after message update...');
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 50);

            // Update conversation list cache
            queryClient.setQueryData<ConversationSummary[] | undefined>(
              conversationQueryKeys.all,
              (previous) => {
                if (!previous) {
                  return previous;
                }

                const found = previous.find((item) => item.id === numericId);

                if (!found) {
                  return previous;
                }

                return previous.map((item) =>
                  item.id === numericId
                    ? {
                        ...item,
                        lastMessagePreview: payload.content,
                        lastMessageAt: payload.sentAt,
                        unreadCount: 0,
                      }
                    : item,
                );
              },
            );
            
            // Auto scroll khi có tin nhắn mới
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
            break;
          }

          case 'TYPING': {
            // Xử lý typing indicator
            if (rawPayload.senderId !== user?.id) {
              const senderName = rawPayload.senderName;
              setTypingUsers((prev) => {
                if (!prev.includes(senderName)) {
                  return [...prev, senderName];
                }
                return prev;
              });

              // Tự động xóa typing sau 3 giây
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((name) => name !== senderName));
              }, 3000);
            }
            break;
          }

          case 'READ': {
            // Cập nhật trạng thái đã đọc
            queryClient.setQueryData<MessageDto[] | undefined>(
              messageQueryKeys.list(numericId),
              (previous) => {
                if (!previous) {
                  return previous;
                }
                return previous.map((msg) =>
                  msg.id === rawPayload.id
                    ? { ...msg, receiptStatus: 'READ' as const }
                    : msg,
                );
              },
            );
            break;
          }

          case 'DELIVERED': {
            // Cập nhật trạng thái đã gửi đến
            queryClient.setQueryData<MessageDto[] | undefined>(
              messageQueryKeys.list(numericId),
              (previous) => {
                if (!previous) {
                  return previous;
                }
                return previous.map((msg) =>
                  msg.id === rawPayload.id
                    ? { ...msg, receiptStatus: 'DELIVERED' as const }
                    : msg,
                );
              },
            );
            break;
          }

          default:
            // Xử lý message không có action (backward compatibility)
            const payload: MessageDto = {
              id: rawPayload.id,
              conversationId: rawPayload.conversationId,
              sender: {
                id: rawPayload.senderId,
                username: rawPayload.senderName,
                displayName: rawPayload.senderName,
                avatarUrl: rawPayload.senderAvatar || undefined,
              },
              content: rawPayload.content,
              messageType: rawPayload.messageType,
              sentAt: rawPayload.sentAt,
              receiptStatus: rawPayload.receiptStatus,
              fileUrl: rawPayload.fileUrl,
              fileName: rawPayload.fileName,
              fileSize: rawPayload.fileSize,
              fileType: rawPayload.fileType,
              thumbnailUrl: rawPayload.thumbnailUrl,
            };

            console.log('📬 [Chat] Updating cache with message (no action):', payload.id);

            queryClient.setQueryData<MessageDto[] | undefined>(
              messageQueryKeys.list(numericId),
              (previous) => {
                if (!previous) {
                  return [payload];
                }

                const exists = previous.some((item) => item.id === payload.id);
                if (exists) {
                  // Update existing message
                  const updated = previous.map((item) => (item.id === payload.id ? payload : item));
                  // Sắp xếp lại theo sentAt
                  updated.sort((a, b) => {
                    const dateA = new Date(a.sentAt).getTime();
                    const dateB = new Date(b.sentAt).getTime();
                    return dateA - dateB;
                  });
                  return updated;
                }

                // Thêm message mới và sắp xếp lại
                const updated = [...previous, payload];
                updated.sort((a, b) => {
                  const dateA = new Date(a.sentAt).getTime();
                  const dateB = new Date(b.sentAt).getTime();
                  return dateA - dateB;
                });
                return updated;
              },
            );

            // Invalidate để đảm bảo UI được update
            queryClient.invalidateQueries({ 
              queryKey: messageQueryKeys.list(numericId),
              refetchType: 'none',
            });
            
            // Cập nhật local state ngay lập tức
            setLocalMessages((prev) => {
              console.log('📬 [Chat] (default) Current localMessages count:', prev.length);
              const exists = prev.some((item) => item.id === payload.id);
              if (exists) {
                const updated = prev.map((item) => (item.id === payload.id ? payload : item));
                updated.sort((a, b) => {
                  const dateA = new Date(a.sentAt).getTime();
                  const dateB = new Date(b.sentAt).getTime();
                  return dateA - dateB;
                });
                console.log('📬 [Chat] (default) Local state updated, new count:', updated.length);
                return updated;
              }
              const updated = [...prev, payload];
              updated.sort((a, b) => {
                const dateA = new Date(a.sentAt).getTime();
                const dateB = new Date(b.sentAt).getTime();
                return dateA - dateB;
              });
              console.log('📬 [Chat] (default) Local state updated, new count:', updated.length);
              return updated;
            });

            // Force re-render
            setMessageUpdateKey(prev => {
              const newKey = prev + 1;
              console.log('📬 [Chat] (default) Update key changed:', newKey);
              return newKey;
            });
            break;
        }
      } catch (error) {
        console.warn('❌ [Chat] Không thể phân tích tin nhắn realtime:', error);
        console.warn('Raw message body:', message.body);
      }
    });

    // Lưu unsubscribe function vào ref
    subscriptionRef.current = unsubscribe;

    return () => {
      console.log('🔕 [Chat] Cleaning up subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [connected, numericId, queryClient, subscribe, user?.id]);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    const originalDraft = draft;
    setDraft('');

    console.log('🚀 [Chat] Sending message:', {
      conversationId: numericId,
      content: originalDraft,
      connected,
      method: connected ? 'WebSocket' : 'HTTP',
    });

    try {
      // Gửi qua WebSocket nếu connected, ngược lại dùng HTTP
      if (connected) {
        sendMessageWS(numericId, originalDraft, 'TEXT');
      } else {
        console.log('📡 [Chat] Using HTTP fallback');
        await sendMessageMutation.mutateAsync({ content: originalDraft, messageType: 'TEXT' });
      }
      
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('❌ [Chat] Send message failed:', error);
      console.warn('Gửi tin nhắn thất bại', error);
      setDraft(originalDraft);
    }
  };

  /**
   * Gửi tin nhắn có ảnh
   */
  const handleSendImage = async (uploadResult: any) => {
    try {
      console.log('📷 [Chat] Sending image message');
      
      await sendMessageMutation.mutateAsync({
        content: draft.trim() || '📷 Đã gửi một ảnh',
        messageType: 'IMAGE',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        thumbnailUrl: uploadResult.thumbnailUrl,
      });

      setDraft('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('❌ [Chat] Send image failed:', error);
      Alert.alert('Lỗi', 'Không thể gửi ảnh');
    }
  };

  /**
   * Gửi tin nhắn có video
   */
  const handleSendVideo = async (uploadResult: any) => {
    try {
      console.log('🎥 [Chat] Sending video message');
      
      await sendMessageMutation.mutateAsync({
        content: draft.trim() || '🎥 Đã gửi một video',
        messageType: 'VIDEO',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        thumbnailUrl: uploadResult.thumbnailUrl,
      });

      setDraft('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('❌ [Chat] Send video failed:', error);
      Alert.alert('Lỗi', 'Không thể gửi video');
    }
  };

  /**
   * Gửi tin nhắn có file
   */
  const handleSendFile = async (uploadResult: any) => {
    try {
      console.log('📁 [Chat] Sending file message');
      
      await sendMessageMutation.mutateAsync({
        content: draft.trim() || '📎 Đã gửi một file',
        messageType: 'FILE',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
      });

      setDraft('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('❌ [Chat] Send file failed:', error);
      Alert.alert('Lỗi', 'Không thể gửi file');
    }
  };

  /**
   * Hiển thị menu chọn loại file
   */
  const showAttachmentMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', '📷 Chụp ảnh', '🖼️ Chọn ảnh', '🎥 Chọn video', '📁 Chọn file'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const result = await takeAndUploadPhoto();
            if (result) await handleSendImage(result);
          } else if (buttonIndex === 2) {
            const result = await pickAndUploadImage();
            if (result) await handleSendImage(result);
          } else if (buttonIndex === 3) {
            const result = await pickAndUploadVideo();
            if (result) await handleSendVideo(result);
          } else if (buttonIndex === 4) {
            const result = await pickAndUploadDocument();
            if (result) await handleSendFile(result);
          }
        }
      );
    } else {
      Alert.alert(
        'Đính kèm file',
        'Chọn loại file muốn gửi',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: '📷 Chụp ảnh', 
            onPress: async () => {
              const result = await takeAndUploadPhoto();
              if (result) await handleSendImage(result);
            }
          },
          { 
            text: '🖼️ Chọn ảnh', 
            onPress: async () => {
              const result = await pickAndUploadImage();
              if (result) await handleSendImage(result);
            }
          },
          { 
            text: '🎥 Chọn video', 
            onPress: async () => {
              const result = await pickAndUploadVideo();
              if (result) await handleSendVideo(result);
            }
          },
          { 
            text: '📁 Chọn file', 
            onPress: async () => {
              const result = await pickAndUploadDocument();
              if (result) await handleSendFile(result);
            }
          },
        ]
      );
    }
  };

  // Xử lý khi người dùng gõ
  const handleTextChange = (text: string) => {
    setDraft(text);

    // Gửi typing indicator
    if (text.length > 0 && connected) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      sendTypingIndicator(numericId);

      // Reset typing sau 2 giây không gõ
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  // Removed navigation.setOptions to prevent duplicate header

  const markAsRead = useCallback(async () => {
    if (!Number.isFinite(numericId)) {
      return;
    }

    queryClient.setQueryData<ConversationSummary[] | undefined>(
      conversationQueryKeys.all,
      (previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((item) =>
          item.id === numericId
            ? {
                ...item,
                unreadCount: 0,
              }
            : item,
        );
      },
    );

    queryClient.setQueryData<ConversationDetail | undefined>(
      conversationQueryKeys.detail(numericId),
      (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          unreadCount: 0,
        };
      },
    );

    try {
      await markConversationAsRead(numericId);
    } catch (error) {
      console.warn('Không thể cập nhật trạng thái đã đọc', error);
    }
  }, [numericId, queryClient]);

  useFocusEffect(
    useCallback(() => {
      void markAsRead();
      return undefined;
    }, [markAsRead]),
  );

  useEffect(() => {
    if (messages?.length) {
      void markAsRead();
    }
  }, [messages, markAsRead]);

  // Cleanup typing timeout khi unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Group messages by date and render date separators
  // MUST be before early returns to follow Rules of Hooks
  const groupedMessages = useMemo(() => {
    const groups: Array<{ type: 'date' | 'message'; date?: string; message?: MessageDto }> = [];
    let currentDate = '';

    displayMessages.forEach((msg) => {
      const msgDate = dayjs(msg.sentAt).format('YYYY-MM-DD');
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      let displayDate = '';
      if (msgDate === today) {
        displayDate = 'Today';
      } else if (msgDate === yesterday) {
        displayDate = 'Yesterday';
      } else {
        displayDate = dayjs(msg.sentAt).format('DD MMM YYYY');
      }

      if (currentDate !== displayDate) {
        groups.push({ type: 'date', date: displayDate });
        currentDate = displayDate;
      }
      groups.push({ type: 'message', message: msg });
    });

    return groups;
  }, [displayMessages]);

  if (!Number.isFinite(numericId)) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Cuộc trò chuyện không hợp lệ</ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Không thể tải tin nhắn</ThemedText>
        <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
          <ThemedText style={styles.retryText}>Thử lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: { type: 'date' | 'message'; date?: string; message?: MessageDto } }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateBubble}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      );
    }

    if (item.message) {
      const isMine = item.message.sender.id === user?.id;
      return <MessageItem message={item.message} isOwn={isMine} />;
    }

    return null;
  };

  const renderMessage = ({ item }: { item: MessageDto }) => {
    const isMine = item.sender.id === user?.id;
    return <MessageItem message={item} isOwn={isMine} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
        style={styles.wrapper}>
      <View style={styles.container}>
        {/* Header */}
        {conversationDetail && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{conversationDetail.title}</Text>
              {conversationDetail.participants.length > 0 && (
                <Text style={styles.headerSubtitle}>
                  @{conversationDetail.participants[0]?.user.username || ''}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.phoneButton}>
              <Ionicons name="call" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Content with Gradient Background */}
        <LinearGradient
          colors={['#F0F4F8', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}>
          <FlatList
            data={groupedMessages}
            ref={flatListRef}
            keyExtractor={(item, index) => 
              item.type === 'date' ? `date-${item.date}` : `${item.message?.id}-${item.message?.sentAt}-${index}`
            }
            renderItem={renderItem}
          onContentSizeChange={() => {
            // Auto scroll khi có nội dung mới
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          onLayout={() => {
            // Scroll đến cuối khi layout được tính toán
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={() => void refetch()}
          // Sử dụng localMessages.length và messageUpdateKey để force re-render
          extraData={localMessages.length + messageUpdateKey}
          // Thêm removeClippedSubviews để tối ưu performance
          removeClippedSubviews={false}
          // Key prop để force re-render khi có thay đổi
          key={`messages-${localMessages.length}-${messageUpdateKey}`}
          // Đảm bảo FlatList luôn re-render khi data thay đổi
          maintainVisibleContentPosition={null}
          />
          </LinearGradient>
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.join(', ')} đang gõ...
            </Text>
          </View>
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#0a84ff" />
            <Text style={styles.uploadingText}>Đang tải file lên...</Text>
          </View>
        )}
        
        {/* Input Area */}
        <View style={styles.composer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={showAttachmentMenu}
            disabled={isUploading || sendMessageMutation.isPending}>
            <View style={styles.addButtonCircle}>
              <Ionicons
                name="add"
                size={24}
                color={isUploading || sendMessageMutation.isPending ? '#ccc' : '#000'}
              />
            </View>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type a message.."
            placeholderTextColor="#999"
            value={draft}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSend}
            editable={!sendMessageMutation.isPending && !isUploading}
            multiline
          />
          {draft.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={sendMessageMutation.isPending || isUploading}>
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.micButton}
              disabled={isUploading || sendMessageMutation.isPending}>
              <Ionicons
                name="mic"
                size={24}
                color={isUploading || sendMessageMutation.isPending ? '#ccc' : '#000'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBubble: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  offlineIndicator: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffc107',
  },
  offlineText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0a84ff',
  },
  retryText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  bubbleMine: {
    marginLeft: 'auto',
    backgroundColor: '#0a84ff',
  },
  bubbleTheirs: {
    marginRight: 'auto',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  senderName: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageTextMine: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  timestampMine: {
    color: '#f0f0f0',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  receiptStatus: {
    fontSize: 12,
    color: '#4fc3f7',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#f0f0f0',
  },
  uploadingText: {
    fontSize: 13,
    opacity: 0.7,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  attachButton: {
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#0a84ff',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  phoneButton: {
    padding: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  addButton: {
    padding: 4,
  },
  addButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    color: '#000',
  },
  micButton: {
    padding: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
