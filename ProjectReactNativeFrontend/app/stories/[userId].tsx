import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStories, useUserStories, useViewStory } from '@/hooks/api/use-stories';
import { useAuth } from '@/contexts/auth-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;
export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const numericUserId = userId ? Number(userId) : null;
  const router = useRouter();
  const { user } = useAuth();
  const { data: userStories } = useUserStories(numericUserId || 0);
  const viewStory = useViewStory();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const videoRef = useRef<Video>(null);
  const stories = userStories || [];
  const currentStory = stories[currentStoryIndex];
  const [videoKey, setVideoKey] = useState(Date.now());
  const prevStoryKeyRef = useRef<string>('');
  
  useEffect(() => {
    if (currentStory && !currentStory.isViewed && !currentStory.isOwn) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory?.id]);
  
  useEffect(() => {
    if (!currentStory) return;
    
    const storyKey = `${currentStory.id}-${currentStoryIndex}`;
    
    if (prevStoryKeyRef.current !== storyKey) {
      setProgress(0);
      progressAnim.setValue(0);
      setVideoStatus(null);
      setIsPaused(false);
      setVideoKey(Date.now());
      prevStoryKeyRef.current = storyKey;
      
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    }
  }, [currentStory?.id, currentStoryIndex]);
  
  useEffect(() => {
    prevStoryKeyRef.current = '';
    setVideoKey(Date.now());
    setProgress(0);
    progressAnim.setValue(0);
    setVideoStatus(null);
    setIsPaused(false);
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
      prevStoryKeyRef.current = '';
    };
  }, [numericUserId]);
  
  useEffect(() => {
    if (currentStory?.videoUrl && videoRef.current && videoStatus && (videoStatus as any).isLoaded) {
      if (!isPaused) {
        videoRef.current.playAsync().catch(() => {});
      } else {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [currentStory?.videoUrl, isPaused, videoStatus]);
  
  useEffect(() => {
    if (!currentStory || stories.length === 0) {
      return;
    }
    
    if (currentStory.videoUrl) {
      return;
    } else {
      if (isPaused) {
        return;
      }
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (STORY_DURATION / 100));
          if (newProgress >= 100) {
            setTimeout(() => {
              if (currentStoryIndex < stories.length - 1) {
                setCurrentStoryIndex(currentStoryIndex + 1);
              } else {
                router.back();
              }
            }, 100);
            return 100;
          }
          return newProgress;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStory, isPaused, currentStoryIndex, stories.length]);
  
  useEffect(() => {
    if (currentStory?.videoUrl && videoStatus) {
      const status = videoStatus as any;
      if (status?.isLoaded && status?.didJustFinish && !isPaused) {
        const timeoutId = setTimeout(() => {
          handleNextStory();
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [videoStatus, currentStory?.videoUrl, isPaused, handleNextStory]);
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  const handleNextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  }, [currentStoryIndex, stories.length, router]);
  
  const handlePrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentStoryIndex, router]);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          if (Math.abs(gestureState.dx) > 50) {
            if (gestureState.dx > 0) {
              handlePrevStory();
            } else {
              handleNextStory();
            }
          }
        } else {
          if (Math.abs(gestureState.dy) > 50 && gestureState.dy > 0) {
            router.back();
          }
        }
      },
    })
  ).current;
  
  const handleLeftPress = () => {
    handlePrevStory();
  };
  
  const handleRightPress = () => {
    handleNextStory();
  };
  if (stories.length === 0 || !currentStory) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {stories.length === 0 ? 'Không có story nào' : 'Đang tải story...'}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  const timeAgo = dayjs(currentStory.createdAt).fromNow();
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TouchableOpacity
          style={styles.leftTouchArea}
          onPress={handleLeftPress}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.rightTouchArea}
          onPress={handleRightPress}
          activeOpacity={1}
        />
        {currentStory.imageUrl && (
          <Image 
            source={{ uri: currentStory.imageUrl }} 
            style={styles.storyImage} 
            resizeMode="cover"
            onError={(e) => {
              // Failed to load story image
            }}
          />
        )}
        {currentStory.videoUrl && (
          <View style={styles.videoContainer}>
            <Video
              key={`video-${currentStory.id}-${videoKey}`}
              ref={videoRef}
              source={{ uri: currentStory.videoUrl }}
              style={styles.storyVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!isPaused}
              isLooping={false}
              isMuted={false}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status) => {
                setVideoStatus(status);
                if (status.isLoaded) {
                  if (status.durationMillis && status.positionMillis !== undefined) {
                    const progress = (status.positionMillis / status.durationMillis) * 100;
                    setProgress(Math.min(Math.max(progress, 0), 100));
                  }
                }
              }}
              onLoadStart={() => {
                setVideoStatus({ isLoaded: false } as any);
              }}
              onLoad={(status) => {
                setVideoStatus(status);
                if (videoRef.current && !isPaused) {
                  videoRef.current.setPositionAsync(0).then(() => {
                    videoRef.current?.playAsync().catch(() => {});
                  }).catch(() => {
                    videoRef.current?.playAsync().catch(() => {});
                  });
                }
              }}
              onError={(error) => {
                // Video playback error
              }}
            />
            {(!videoStatus || (videoStatus as any).isLoading || !(videoStatus as any).isLoaded) && (
              <View style={styles.videoLoadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />
        <View style={styles.header}>
          <View style={styles.progressBarContainer}>
            {stories.map((_, index) => (
              <View key={index} style={styles.progressBarWrapper}>
                <View style={[styles.progressBarBg, { opacity: index < currentStoryIndex ? 1 : index === currentStoryIndex ? 0.5 : 0.3 }]} />
                {index === currentStoryIndex && (
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: currentStory.avatarUrl || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStory.displayName || currentStory.username}</Text>
              <View style={styles.metaInfo}>
                <Text style={styles.timestamp}>{timeAgo}</Text>
                {currentStory.musicTitle && (
                  <>
                    <Ionicons name="musical-notes" size={12} color="#fff" style={styles.musicIcon} />
                    <Text style={styles.musicTitle}>{currentStory.musicTitle}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsPaused(!isPaused)}>
              <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color="#fff" />
            </TouchableOpacity>
            {currentStory.isOwn && (
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {currentStory.textOverlay && (
          <View style={styles.textOverlayContainer}>
            <Text style={styles.textOverlay}>{currentStory.textOverlay}</Text>
          </View>
        )}
        {!currentStory.isOwn && (
          <View style={styles.footer}>
            <View style={styles.replyContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder={`Trả lời ${currentStory.displayName || currentStory.username}...`}
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity style={styles.replyButton}>
                <Ionicons name="send" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="paper-plane-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {currentStory.isOwn && (
          <View style={styles.footer}>
            <View style={styles.ownStoryInfo}>
              <View style={styles.viewCountContainer}>
                <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.viewCountText}>{currentStory.viewCount || 0} lượt xem</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  storyImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
    marginBottom: 12,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 8,
  },
  musicIcon: {
    marginRight: 4,
  },
  musicTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 12,
    top: 50,
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  textOverlayContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  textOverlay: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  replyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  footerButton: {
    padding: 4,
  },
  ownStoryInfo: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
    zIndex: 1,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
    zIndex: 1,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

