import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConversationListItem } from '@/components/conversation-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { conversationQueryKeys, useConversations } from '@/hooks/api/use-conversations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationSummary } from '@/lib/api/conversations';
import { useStomp } from '@/providers/stomp-provider';

export default function ChatsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { connected, subscribe } = useStomp();
  const colorScheme = useColorScheme();
  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useConversations();

  const handlePressConversation = useCallback(
    (conversationId: number) => {
      router.push(`/chat/${conversationId}`);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (!connected) {
      return;
    }

    const unsubscribe = subscribe('/user/queue/conversations', (message) => {
      try {
        const payload = JSON.parse(message.body) as ConversationSummary;

        queryClient.setQueryData<ConversationSummary[] | undefined>(
          conversationQueryKeys.all,
          (previous) => {
            if (!previous) {
              return [payload];
            }

            const index = previous.findIndex((item) => item.id === payload.id);
            if (index === -1) {
              return [payload, ...previous];
            }

            const copy = [...previous];
            copy[index] = { ...copy[index], ...payload };
            return copy;
          },
        );
      } catch (error) {
        console.warn('Không thể phân tích dữ liệu conversation realtime', error);
      }
    });

    return unsubscribe;
  }, [connected, queryClient, subscribe]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.error}>Không thể tải danh sách cuộc trò chuyện</ThemedText>
          <ThemedText onPress={() => void refetch()} style={styles.retry}>
            Thử lại
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header with Search */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.searchContainer,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' }
            ]}
            onPress={() => router.push('/(tabs)/search-users' as any)}
            activeOpacity={0.7}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <ThemedText style={[styles.searchPlaceholder, { color: '#999' }]}>
              Tìm kiếm bạn bè...
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push('/(tabs)/contacts' as any)}>
            <Ionicons name="create-outline" size={24} color="#0a84ff" />
          </TouchableOpacity>
        </View>

        <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ConversationListItem conversation={item} onPress={handlePressConversation} />
        )}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Chưa có cuộc trò chuyện</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Nhấn vào biểu tượng bút để bắt đầu cuộc trò chuyện mới
            </ThemedText>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  newChatButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  error: {
    fontSize: 16,
  },
  retry: {
    color: '#0a84ff',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
