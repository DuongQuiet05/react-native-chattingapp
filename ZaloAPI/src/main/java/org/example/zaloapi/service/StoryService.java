package org.example.zaloapi.service;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.CreateStoryRequest;
import org.example.zaloapi.dto.StoryDto;
import org.example.zaloapi.entity.Story;
import org.example.zaloapi.entity.StoryView;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.FriendshipRepository;
import org.example.zaloapi.repository.StoryRepository;
import org.example.zaloapi.repository.StoryViewRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class StoryService {
    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private static final int STORY_DURATION_HOURS = 24;
    @Transactional
    public StoryDto createStory(Long userId, CreateStoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Story story = new Story();
        story.setUser(user);
        story.setImageUrl(request.getImageUrl());
        story.setVideoUrl(request.getVideoUrl());
        story.setMusicUrl(request.getMusicUrl());
        story.setMusicTitle(request.getMusicTitle());
        story.setTextOverlay(request.getTextOverlay());
        story.setExpiresAt(LocalDateTime.now().plusHours(STORY_DURATION_HOURS));
        story.setViewCount(0L);
        story = storyRepository.save(story);
        return convertToDto(story, userId, false);
    }
    @Transactional(readOnly = true)
    public List<StoryDto> getStoriesForUser(Long userId) {
        List<Long> friendIds = new ArrayList<>(friendshipRepository.findFriendIdsByUserId(userId));
        friendIds.add(userId);
        LocalDateTime now = LocalDateTime.now();
        List<Story> stories = storyRepository.findActiveStoriesByUserIds(friendIds, now);
        return stories.stream()
                .map(story -> {
                    boolean isViewed = storyViewRepository.existsByStoryIdAndUserId(story.getId(), userId);
                    boolean isOwn = story.getUser().getId().equals(userId);
                    return convertToDto(story, userId, isViewed || isOwn);
                })
                .sorted((a, b) -> {
                    if (a.getIsOwn() && !b.getIsOwn()) return -1;
                    if (!a.getIsOwn() && b.getIsOwn()) return 1;
                    if (!a.getIsViewed() && b.getIsViewed()) return -1;
                    if (a.getIsViewed() && !b.getIsViewed()) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<StoryDto> getUserStories(Long targetUserId, Long currentUserId) {
        LocalDateTime now = LocalDateTime.now();
        List<Story> stories = storyRepository.findActiveStoriesByUserId(targetUserId, now);
        return stories.stream()
                .map(story -> {
                    boolean isViewed = storyViewRepository.existsByStoryIdAndUserId(story.getId(), currentUserId);
                    boolean isOwn = story.getUser().getId().equals(currentUserId);
                    return convertToDto(story, currentUserId, isViewed || isOwn);
                })
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public StoryDto getStory(Long storyId, Long userId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (story.isExpired()) {
            throw new RuntimeException("Story has expired");
        }
        boolean isViewed = storyViewRepository.existsByStoryIdAndUserId(storyId, userId);
        boolean isOwn = story.getUser().getId().equals(userId);
        return convertToDto(story, userId, isViewed || isOwn);
    }
    @Transactional
    public void viewStory(Long storyId, Long userId) {
        if (storyViewRepository.existsByStoryIdAndUserId(storyId, userId)) {
            return;
        }
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (story.isExpired()) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StoryView storyView = new StoryView();
        storyView.setStory(story);
        storyView.setUser(user);
        storyViewRepository.save(storyView);
        story.setViewCount(story.getViewCount() + 1);
        storyRepository.save(story);
    }
    @Transactional
    public void deleteStory(Long storyId, Long userId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this story");
        }
        storyRepository.delete(story);
    }
    private StoryDto convertToDto(Story story, Long currentUserId, boolean isViewed) {
        User user = story.getUser();
        boolean isOwn = user.getId().equals(currentUserId);
        return StoryDto.builder()
                .id(story.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .imageUrl(story.getImageUrl())
                .videoUrl(story.getVideoUrl())
                .musicUrl(story.getMusicUrl())
                .musicTitle(story.getMusicTitle())
                .textOverlay(story.getTextOverlay())
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .viewCount(story.getViewCount())
                .isViewed(isViewed)
                .isOwn(isOwn)
                .build();
    }
}

