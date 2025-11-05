import type { MessageDto } from '@/lib/api/messages';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useMessageReactions, useReactToMessage, useRemoveMessageReaction } from '@/hooks/api/use-reactions';
import { useAuth } from '@/contexts/auth-context';

interface MessageItemProps {
  message: MessageDto;
  isOwn: boolean;
}

const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { data: reactions } = useMessageReactions(message.id);
  const reactToMessage = useReactToMessage();
  const removeReaction = useRemoveMessageReaction();
  const [showReactions, setShowReactions] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openFile = async () => {
    if (message.fileUrl) {
      try {
        await Linking.openURL(message.fileUrl);
      } catch (error) {
        console.error('Cannot open file:', error);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReaction = async (reactionType: string) => {
    const userReaction = reactions?.find((r) => r.userId === user?.id && r.reactionType === reactionType);
    if (userReaction) {
      await removeReaction.mutateAsync(message.id);
    } else {
      await reactToMessage.mutateAsync({ messageId: message.id, reaction: { reactionType } });
    }
    setShowReactions(false);
  };

  const userReactions = reactions?.filter((r) => r.userId === user?.id) || [];
  const otherReactions = reactions?.filter((r) => r.userId !== user?.id) || [];
  const reactionCount = reactions?.length || 0;

  return (
    <View
      style={[
        styles.container,
        { alignSelf: isOwn ? 'flex-end' : 'flex-start' },
      ]}>
      {/* IMAGE Message */}
      {message.messageType === 'IMAGE' && message.fileUrl && (
        <TouchableOpacity onPress={openFile} style={styles.imageContainer}>
          <Image
            source={{ uri: message.thumbnailUrl || message.fileUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          {message.content && message.content !== '📷 Đã gửi một ảnh' && (
            <View style={[styles.textBubble, { backgroundColor: isOwn ? '#0a84ff' : '#f0f0f0' }]}>
              <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
                {message.content}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* VIDEO Message */}
      {message.messageType === 'VIDEO' && message.fileUrl && (
        <TouchableOpacity onPress={openFile} style={styles.videoContainer}>
          {message.thumbnailUrl ? (
            <Image source={{ uri: message.thumbnailUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={64} color="#fff" />
            </View>
          )}

          {/* Play Icon Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </View>

          {message.content && message.content !== '🎥 Đã gửi một video' && (
            <View style={[styles.textBubble, { backgroundColor: isOwn ? '#0a84ff' : '#f0f0f0' }]}>
              <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
                {message.content}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* FILE Message */}
      {message.messageType === 'FILE' && message.fileUrl && (
        <TouchableOpacity onPress={openFile} style={styles.fileContainer}>
          <Ionicons name="document" size={32} color="#0a84ff" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName}
            </Text>
            <Text style={styles.fileSize}>{formatFileSize(message.fileSize)}</Text>
          </View>
          <Ionicons name="download" size={20} color="#0a84ff" />
        </TouchableOpacity>
      )}

      {/* TEXT Message */}
      {message.messageType === 'TEXT' && (
        <View style={[styles.textBubble, { backgroundColor: isOwn ? '#0a84ff' : '#f0f0f0' }]}>
          <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
            {message.content}
          </Text>
        </View>
      )}

      {/* Reactions */}
      {reactionCount > 0 && (
        <View style={[styles.reactionsContainer, { alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
          {otherReactions.slice(0, 3).map((reaction, index) => (
            <Text key={index} style={styles.reactionEmoji}>
              {REACTION_EMOJIS[reaction.reactionType as keyof typeof REACTION_EMOJIS]}
            </Text>
          ))}
          {reactionCount > 3 && (
            <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
              +{reactionCount - 3}
            </Text>
          )}
        </View>
      )}

      {/* Reaction Picker */}
      {showReactions && (
        <View style={[styles.reactionsPicker, { backgroundColor: colors.card }]}>
          {REACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.reactionOption}
              onPress={() => handleReaction(type)}>
              <Text style={styles.reactionEmojiLarge}>
                {REACTION_EMOJIS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Message Actions */}
      <View style={[styles.messageActions, { alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReactions(!showReactions)}
          onLongPress={() => setShowReactions(true)}>
          <Ionicons
            name={userReactions.length > 0 ? 'heart' : 'heart-outline'}
            size={16}
            color={userReactions.length > 0 ? '#FF3B30' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Time */}
      <Text style={[styles.time, { textAlign: isOwn ? 'right' : 'left' }]}>
        {formatTime(message.sentAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '70%',
    margin: 5,
    position: 'relative',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 10,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontWeight: '600',
    fontSize: 14,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  textBubble: {
    padding: 10,
    borderRadius: 15,
    marginTop: 4,
  },
  text: {
    fontSize: 16,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  reactionsPicker: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  reactionOption: {
    padding: Spacing.xs,
  },
  reactionEmojiLarge: {
    fontSize: 28,
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
  },
  time: {
    fontSize: 10,
    color: '#999',
    marginTop: 3,
  },
});
