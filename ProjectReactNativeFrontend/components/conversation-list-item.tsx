import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';

import type { ConversationSummary } from '@/lib/api/conversations';

dayjs.extend(relativeTime);

interface Props {
  conversation: ConversationSummary;
  onPress: (conversationId: number) => void;
}

function ConversationListItemComponent({ conversation, onPress }: Props) {
  // Format time as HH:mm
  const timeDisplay = conversation.lastMessageAt
    ? dayjs(conversation.lastMessageAt).format('HH:mm')
    : undefined;

  // Đảm bảo title luôn có giá trị
  const title = conversation.title || 'Cuộc trò chuyện';
  const firstLetter = title.charAt(0).toUpperCase();

  // Determine what to show: unread badge or status
  const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;
  const showStatus = !hasUnread && conversation.type === 'PRIVATE' && conversation.participantStatus;

  return (
    <TouchableOpacity onPress={() => onPress(conversation.id)} activeOpacity={0.7}>
      <View style={styles.container}>
        {conversation.avatarUrl ? (
          <Image source={{ uri: String(conversation.avatarUrl) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{String(firstLetter)}</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.row}>
            <Text numberOfLines={1} style={styles.title}>
              {String(title)}
            </Text>
            <View style={styles.rightSection}>
              {timeDisplay ? (
                <Text style={styles.timestamp}>{String(timeDisplay)}</Text>
              ) : null}
              {hasUnread && typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {conversation.unreadCount > 99 ? '99+' : String(conversation.unreadCount)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.previewRow}>
            {conversation.lastMessagePreview ? (
              <Text numberOfLines={1} style={styles.preview}>
                {String(conversation.lastMessagePreview)}
              </Text>
            ) : (
              <Text numberOfLines={1} style={styles.previewPlaceholder}>
                Chưa có tin nhắn
              </Text>
            )}
            {showStatus && conversation.participantStatus ? (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    conversation.participantStatus === 'ONLINE'
                      ? styles.statusDotOnline
                      : styles.statusDotOffline,
                  ]}
                />
                <Text style={styles.statusText}>
                  {conversation.participantStatus === 'ONLINE' ? 'Online' : 'Offline'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
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
    backgroundColor: '#fff',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  previewPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#34C759',
  },
  statusDotOffline: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
