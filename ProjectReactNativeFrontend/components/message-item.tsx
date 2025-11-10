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
  showSenderName?: boolean;
  previousMessage?: MessageDto | null;
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
export function MessageItem({ message, isOwn, showSenderName = false, previousMessage }: MessageItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { data: reactions } = useMessageReactions(message.id);
  const reactToMessage = useReactToMessage();
  const removeReaction = useRemoveMessageReaction();
  const [showReactions, setShowReactions] = useState(false);
  
  const shouldShowAvatar = !isOwn && showSenderName;
  const senderName = message.sender.displayName || message.sender.username || 'Unknown';
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
      } catch (error) {}
    }
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}.${displayMinutes} ${ampm}`;
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
  const reactionCount = reactions?.length || 0;
  
  const groupedReactions = reactions?.reduce((acc, reaction) => {
    const type = reaction.reactionType.toUpperCase() as keyof typeof REACTION_EMOJIS;
    if (REACTION_EMOJIS[type]) {
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(reaction);
    }
    return acc;
  }, {} as Record<string, typeof reactions>) || {};
  
  const reactionTypes = Object.keys(groupedReactions) as Array<keyof typeof REACTION_EMOJIS>;
  
  const formatTimeForBubble = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const displayHours = hours.toString().padStart(2, '0');
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes}`;
  };
  
  return (
    <View
      style={[
        styles.wrapper,
        isOwn ? styles.wrapperRight : styles.wrapperLeft,
      ]}>
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {shouldShowAvatar && (
            <Image
              source={{ uri: message.sender.avatarUrl || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
          )}
        </View>
      )}
      <View style={[styles.messageContainer, isOwn ? styles.messageContainerRight : styles.messageContainerLeft]}>
        {shouldShowAvatar && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => setShowReactions(true)}
          onPress={() => setShowReactions(false)}>
          {/* IMAGE Message */}
          {message.messageType === 'IMAGE' && message.fileUrl && (
            <View style={styles.imageWrapper}>
              <TouchableOpacity onPress={openFile} style={styles.imageContainer}>
                <Image
                  source={{ uri: message.thumbnailUrl || message.fileUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              {message.content && message.content !== '📷 Đã gửi một ảnh' && (
                <View style={[styles.textBubble, { backgroundColor: isOwn ? '#007AFF' : '#fff' }]}>
                  <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
                    {message.content}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* VIDEO Message */}
          {message.messageType === 'VIDEO' && message.fileUrl && (
            <View style={styles.videoWrapper}>
              <TouchableOpacity onPress={openFile} style={styles.videoContainer}>
                {message.thumbnailUrl ? (
                  <Image source={{ uri: message.thumbnailUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={64} color="#fff" />
                  </View>
                )}
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={32} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              {message.content && message.content !== '🎥 Đã gửi một video' && (
                <View style={[styles.textBubble, { backgroundColor: isOwn ? '#007AFF' : '#fff' }]}>
                  <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
                    {message.content}
                  </Text>
                </View>
              )}
            </View>
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
            <View style={[styles.textBubble, { backgroundColor: isOwn ? '#007AFF' : '#fff' }]}>
              <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
                {message.content}
              </Text>
              <Text style={[styles.timeInBubble, { color: isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                {formatTimeForBubble(message.sentAt)}
              </Text>
            </View>
          )}
          {/* Reactions - Hiển thị bên dưới message bubble */}
          {reactionCount > 0 && (
            <View style={[styles.reactionsContainer, { alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
              {reactionTypes.map((type) => {
                return (
                  <Text key={type} style={styles.reactionEmoji}>
                    {REACTION_EMOJIS[type]}
                  </Text>
                );
              })}
            </View>
          )}
        </TouchableOpacity>
        {/* Reaction Picker */}
        {showReactions && (
          <View style={[styles.reactionsPicker, { backgroundColor: '#FFFFFF' }]}>
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
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 2,
    marginHorizontal: 8,
  },
  wrapperLeft: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  wrapperRight: {
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  messageContainer: {
    maxWidth: '75%',
    position: 'relative',
    flex: 1,
  },
  messageContainerLeft: {
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
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
  videoWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 6,
    borderRadius: 16,
    position: 'relative',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  timeInBubble: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    bottom: '100%',
    left: 0,
    marginBottom: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  reactionOption: {
    padding: 4,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmojiLarge: {
    fontSize: 24,
  },
});