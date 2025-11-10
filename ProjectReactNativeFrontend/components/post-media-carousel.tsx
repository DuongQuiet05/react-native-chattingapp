import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Colors, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
const { width } = Dimensions.get('window');
/**
 * Check if a URL is a video based on extension or Cloudinary path
 */
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];
  const lowerUrl = url.toLowerCase();
  // Check extension
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  // Check Cloudinary video path pattern
  if (lowerUrl.includes('/video/upload/') || lowerUrl.includes('/video/')) {
    return true;
  }
  return false;
}
interface PostMediaCarouselProps {
  mediaUrls: string[];
  imageWidth?: number;
  imageHeight?: number;
  onPress?: () => void;
  autoPlay?: boolean; // Auto-play video when in view
  shouldPlay?: boolean; // External control for video playback
  useNativeControls?: boolean; // Use native video controls (for post-detail)
  isMuted?: boolean; // Mute video by default
  showMuteButton?: boolean; // Show mute/unmute button overlay (for feed)
}
export function PostMediaCarousel({
  mediaUrls,
  imageWidth = width - 32, // Default: width - padding
  imageHeight = 300,
  onPress,
  autoPlay = false,
  shouldPlay = false,
  useNativeControls = false, // Default: false for feed, true for post-detail
  isMuted = false, // Default: unmuted
  showMuteButton = false, // Show mute button for feed
}: PostMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const [isMutedState, setIsMutedState] = useState(isMuted); // Local state for mute toggle
  const showDots = mediaUrls.length >= 2;
  // Detect media types
  const mediaTypes = mediaUrls.map(url => (isVideoUrl(url) ? 'video' : 'image'));
  useEffect(() => {
    setIsMutedState(isMuted);
  }, [isMuted]);
  // Toggle mute for current video
  const toggleMute = useCallback(() => {
    setIsMutedState((prev) => {
      const newMutedState = !prev;
      const currentVideoRef = videoRefs.current[currentIndex];
      if (currentVideoRef) {
        currentVideoRef.setIsMutedAsync(newMutedState).catch((error) => {});
      }
      return newMutedState;
    });
  }, [currentIndex]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    if (currentIndex >= mediaUrls.length) {
      setCurrentIndex(0);
      currentIndexRef.current = 0;
    }
  }, [mediaUrls.length, currentIndex]);
  useEffect(() => {
    if (shouldPlay && autoPlay) {
      const currentMediaType = mediaTypes[currentIndex];
      if (currentMediaType === 'video') {
        const videoRef = videoRefs.current[currentIndex];
        if (videoRef) {
          // Apply mute state first, then play
          videoRef.setIsMutedAsync(isMutedState).catch((error) => {});
          videoRef.playAsync().catch((error) => {});
        }
      }
    } else {
      // Pause all videos when shouldPlay is false
      Object.values(videoRefs.current).forEach((videoRef) => {
        if (videoRef) {
          videoRef.pauseAsync().catch((error) => {});
        }
      });
    }
  }, [shouldPlay, autoPlay, currentIndex, mediaTypes, isMutedState]);
  // Sync mute state when isMutedState changes
  useEffect(() => {
    if (shouldPlay && autoPlay && mediaTypes[currentIndex] === 'video') {
      const videoRef = videoRefs.current[currentIndex];
      if (videoRef) {
        videoRef.setIsMutedAsync(isMutedState).catch((error) => {});
      }
    }
  }, [isMutedState, currentIndex, shouldPlay, autoPlay, mediaTypes]);
  // Pause previous video when index changes
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const index = parseInt(key);
      if (index !== currentIndex) {
        const videoRef = videoRefs.current[index];
        if (videoRef) {
          videoRef.pauseAsync().catch((error) => {});
        }
      }
    });
    if (shouldPlay && autoPlay && mediaTypes[currentIndex] === 'video') {
      const videoRef = videoRefs.current[currentIndex];
      if (videoRef) {
        // Apply mute state first, then play
        videoRef.setIsMutedAsync(isMutedState).catch((error) => {});
        videoRef.playAsync().catch((error) => {});
      }
    }
  }, [currentIndex, shouldPlay, autoPlay, mediaTypes, isMutedState]);
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current).forEach((videoRef) => {
        if (videoRef) {
          videoRef.pauseAsync().catch((error) => {});
        }
      });
    };
  }, []);
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / imageWidth);
      if (index >= 0 && index < mediaUrls.length && index !== currentIndexRef.current) {
        setCurrentIndex(index);
      }
    },
    [imageWidth, mediaUrls.length],
  );
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / imageWidth);
      if (index >= 0 && index < mediaUrls.length && index !== currentIndexRef.current) {
        setCurrentIndex(index);
      }
    },
    [imageWidth, mediaUrls.length],
  );
  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isVideo = isVideoUrl(item);
    const isCurrentItem = index === currentIndex;
    const shouldPlayVideo = shouldPlay && autoPlay && isCurrentItem && isVideo;
    if (isVideo) {
      return (
        <View style={[styles.videoContainer, { width: imageWidth, height: imageHeight }]}>
          <Video
            ref={(ref) => {
              if (ref) {
                videoRefs.current[index] = ref;
              }
            }}
            source={{ uri: item }}
            style={[styles.video, { width: imageWidth, height: imageHeight }]}
            resizeMode={ResizeMode.COVER}
            shouldPlay={shouldPlayVideo}
            isLooping={!useNativeControls} // Only loop if not using native controls
            isMuted={isMutedState}
            useNativeControls={useNativeControls}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish && !useNativeControls) {
                // Video finished, restart if looping (only if not using native controls)
                const videoRef = videoRefs.current[index];
                if (videoRef && shouldPlayVideo) {
                  videoRef.replayAsync().catch((error) => {});
                }
              }
            }}
          />
          {!shouldPlayVideo && !useNativeControls && (
            <TouchableOpacity
              style={styles.playButtonOverlay}
              onPress={() => {
                const videoRef = videoRefs.current[index];
                if (videoRef) {
                  videoRef.playAsync().catch((error) => {});
                }
              }}
              activeOpacity={0.8}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={48} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
          {/* Mute/Unmute button for feed videos */}
          {showMuteButton && isCurrentItem && isVideo && !useNativeControls && (
            <TouchableOpacity
              style={[styles.muteButton, { bottom: showDots ? 60 : 16 }]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering parent onPress
                toggleMute();
              }}
              activeOpacity={0.8}>
              <View style={styles.muteButtonContainer}>
                <Ionicons
                  name={isMutedState ? 'volume-mute' : 'volume-high'}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return (
      <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
        <Image
          source={{ uri: item }}
          style={[styles.image, { width: imageWidth, height: imageHeight }]}
          resizeMode="cover"
        />
      </View>
    );
  };
  if (mediaUrls.length === 0) {
    return null;
  }
  if (mediaUrls.length === 1) {
    const isVideo = isVideoUrl(mediaUrls[0]);
    const shouldPlayVideo = shouldPlay && autoPlay && isVideo;
    if (isVideo) {
      return (
        <View style={styles.container}>
          <View style={[styles.videoContainer, { width: imageWidth, height: imageHeight }]}>
            <Video
              ref={(ref) => {
                if (ref) {
                  videoRefs.current[0] = ref;
                }
              }}
              source={{ uri: mediaUrls[0] }}
              style={[styles.video, { width: imageWidth, height: imageHeight }]}
              resizeMode={ResizeMode.COVER}
              shouldPlay={shouldPlayVideo}
              isLooping={!useNativeControls}
              isMuted={isMutedState}
              useNativeControls={useNativeControls}
            />
            {!shouldPlayVideo && !useNativeControls && (
              <TouchableOpacity
                style={styles.playButtonOverlay}
                onPress={() => {
                  const videoRef = videoRefs.current[0];
                  if (videoRef) {
                    videoRef.playAsync().catch((error) => {});
                  }
                }}
                activeOpacity={0.8}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={48} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
            {/* Mute/Unmute button for single video in feed */}
            {showMuteButton && isVideo && !useNativeControls && (
              <TouchableOpacity
                style={[styles.muteButton, { bottom: 16 }]}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent triggering parent onPress
                  toggleMute();
                }}
                activeOpacity={0.8}>
                <View style={styles.muteButtonContainer}>
                  <Ionicons
                    name={isMutedState ? 'volume-mute' : 'volume-high'}
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
          <Image
            source={{ uri: mediaUrls[0] }}
            style={[styles.image, { width: imageWidth, height: imageHeight }]}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={mediaUrls}
        renderItem={renderItem}
        keyExtractor={(item, index) => `media-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={imageWidth}
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: imageWidth,
          offset: imageWidth * index,
          index,
        })}
        bounces={false}
      />
      {/* Pagination Dots - chỉ hiển thị khi có từ 2 ảnh trở lên */}
      {showDots && (
        <View style={styles.dotsContainer}>
          <View style={styles.dotsBackground} />
          {mediaUrls.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imageContainer: {
    overflow: 'hidden',
  },
  image: {
    borderRadius: BorderRadius.md,
  },
  videoContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    borderRadius: BorderRadius.md,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4, // Offset để icon play trông cân đối hơn
  },
  muteButton: {
    position: 'absolute',
    right: 16,
    zIndex: 15, // Higher than dots
  },
  muteButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  dotsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  activeDot: {
    width: 24,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});