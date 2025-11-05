import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import type { ConversationSummary } from '@/lib/api/conversations';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

dayjs.extend(relativeTime);

interface Props {
  conversation: ConversationSummary;
  onPress: (conversationId: number) => void;
}

function ConversationListItemComponent({ conversation, onPress }: Props) {
  const lastUpdate = conversation.lastMessageAt
    ? dayjs(conversation.lastMessageAt).fromNow()
    : undefined;

  // Đảm bảo title luôn có giá trị
  const title = conversation.title || 'Cuộc trò chuyện';
  const firstLetter = title.charAt(0).toUpperCase();

  return (
    <TouchableOpacity onPress={() => onPress(conversation.id)} activeOpacity={0.7}>
      <ThemedView style={styles.container}>
        {conversation.avatarUrl ? (
          <Image source={{ uri: conversation.avatarUrl }} style={styles.avatar} />
        ) : (
          <ThemedView style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.avatarFallbackText}>{firstLetter}</ThemedText>
          </ThemedView>
        )}
        <View style={styles.content}>
          <View style={styles.row}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
              {title}
            </ThemedText>
            {lastUpdate ? <ThemedText style={styles.timestamp}>{lastUpdate}</ThemedText> : null}
          </View>
          {conversation.lastMessagePreview ? (
            <ThemedText numberOfLines={1} style={styles.preview}>
              {conversation.lastMessagePreview}
            </ThemedText>
          ) : (
            <ThemedText numberOfLines={1} style={styles.previewPlaceholder}>
              Chưa có tin nhắn
            </ThemedText>
          )}
        </View>
        {conversation.unreadCount ? (
          <ThemedView style={styles.badge}>
            <ThemedText style={styles.badgeText}>{conversation.unreadCount}</ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

export const ConversationListItem = memo(ConversationListItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d0d5dd',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  preview: {
    fontSize: 13,
    opacity: 0.8,
  },
  previewPlaceholder: {
    fontSize: 13,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
