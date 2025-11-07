package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.PostDto;
import org.example.zaloapi.dto.UserDto;
import org.example.zaloapi.dto.UserProfileDto;
import org.example.zaloapi.entity.Post;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.CommentRepository;
import org.example.zaloapi.repository.ConversationRepository;
import org.example.zaloapi.repository.PostReactionRepository;
import org.example.zaloapi.repository.PostRepository;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.service.GeminiService.PostContent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostReactionRepository postReactionRepository;
    private final ConversationRepository conversationRepository;

    // User Management Methods
    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (search != null && !search.trim().isEmpty()) {
            return userRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                    search, search, pageable
            ).map(this::convertToDto);
        }
        
        return userRepository.findAll(pageable).map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, User.UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        user = userRepository.save(user);
        return convertToDto(user);
    }

    @Transactional
    public UserDto blockUser(Long userId, Long currentAdminId) {
        // Prevent admin from blocking themselves
        if (userId.equals(currentAdminId)) {
            throw new RuntimeException("Admin cannot block themselves");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsBlocked(true);
        user = userRepository.save(user);
        return convertToDto(user);
    }

    @Transactional
    public UserDto unblockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsBlocked(false);
        user = userRepository.save(user);
        return convertToDto(user);
    }

    @Transactional
    public UserProfileDto updateUserProfile(Long userId, org.example.zaloapi.dto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        
        user = userRepository.save(user);
        return convertToProfileDto(user);
    }

    // Post Management Methods
    @Transactional(readOnly = true)
    public Page<PostDto> getAllPosts(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (search != null && !search.trim().isEmpty()) {
            List<Post> posts = postRepository.findAll().stream()
                    .filter(p -> p.getContent() != null && p.getContent().toLowerCase().contains(search.toLowerCase()))
                    .collect(Collectors.toList());
            
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), posts.size());
            List<Post> pagedPosts = posts.subList(start, end);
            
            return new org.springframework.data.domain.PageImpl<>(
                    pagedPosts.stream()
                            .map(p -> convertPostToDto(p))
                            .collect(Collectors.toList()),
                    pageable,
                    posts.size()
            );
        }
        
        return postRepository.findAll(pageable).map(this::convertPostToDto);
    }

    @Transactional(readOnly = true)
    public PostDto getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return convertPostToDto(post);
    }

    @Transactional
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        postRepository.delete(post);
    }

    @Transactional
    public PostDto hidePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setIsHidden(true);
        post = postRepository.save(post);
        return convertPostToDto(post);
    }

    @Transactional
    public PostDto unhidePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setIsHidden(false);
        post = postRepository.save(post);
        return convertPostToDto(post);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getPostsByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertPostToDto);
    }

    // Statistics
    @Transactional(readOnly = true)
    public Long getTotalUsers() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public Long getTotalPosts() {
        return postRepository.count();
    }

    @Transactional(readOnly = true)
    public Long getTotalAdmins() {
        return userRepository.countByRole(User.UserRole.ADMIN);
    }

    @Transactional(readOnly = true)
    public Long getTotalConversations() {
        return conversationRepository.count();
    }

    // Post Analysis Methods
    @Transactional(readOnly = true)
    public List<PostContent> getPostsForAnalysis(Integer maxPosts) {
        // Ensure we get 100-200 posts (default 150 if not specified)
        int limit = maxPosts != null 
                ? Math.max(100, Math.min(maxPosts, 200))  // Clamp between 100-200
                : 150; // Default 150 posts
        
        // Get recent posts with optimized data, sorted by createdAt DESC (newest first)
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findAll(pageable);
        
        // If we have less than requested, use what we have (but at least try to get 100)
        List<Post> postList = posts.getContent();
        if (postList.size() < 100 && limit > postList.size()) {
            // Try to get more if available
            Pageable largerPageable = PageRequest.of(0, Math.max(100, postList.size()), Sort.by("createdAt").descending());
            Page<Post> allPosts = postRepository.findAll(largerPageable);
            postList = allPosts.getContent();
        }
        
        return postList.stream()
                .map(post -> {
                    long commentCount = commentRepository.countByPostId(post.getId());
                    long reactionCount = postReactionRepository.findByPostId(post.getId()).size();
                    
                    return new PostContent(
                            post.getContent() != null ? post.getContent() : "",
                            post.getAuthor().getDisplayName() != null ? post.getAuthor().getDisplayName() : post.getAuthor().getUsername(),
                            post.getCreatedAt() != null ? post.getCreatedAt().toString() : "",
                            reactionCount,
                            commentCount
                    );
                })
                .collect(Collectors.toList());
    }

    // Converters
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setDisplayName(user.getDisplayName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setStatus(user.getStatus().name());
        dto.setRole(user.getRole().name());
        dto.setIsBlocked(user.getIsBlocked());
        dto.setLastSeen(user.getLastSeen());
        return dto;
    }

    private UserProfileDto convertToProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .status(user.getStatus().name())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PostDto convertPostToDto(Post post) {
        long commentCount = commentRepository.countByPostId(post.getId());
        long reactionCount = postReactionRepository.findByPostId(post.getId()).size();

        return PostDto.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getDisplayName())
                .authorAvatar(post.getAuthor().getAvatarUrl())
                .content(post.getContent())
                .privacyType(post.getPrivacyType().name())
                .mediaUrls(post.getMediaUrls())
                .location(post.getLocation())
                .commentCount(commentCount)
                .reactionCount(reactionCount)
                .userReaction(null) // Admin view doesn't need user reaction
                .isHidden(post.getIsHidden())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}

