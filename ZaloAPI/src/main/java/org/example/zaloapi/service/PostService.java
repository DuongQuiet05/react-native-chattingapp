package org.example.zaloapi.service;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.CreatePostRequest;
import org.example.zaloapi.dto.PostDto;
import org.example.zaloapi.entity.Post;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.BlockedUserRepository;
import org.example.zaloapi.repository.FriendshipRepository;
import org.example.zaloapi.repository.PostReactionRepository;
import org.example.zaloapi.repository.PostRepository;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.repository.CommentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostReactionRepository postReactionRepository;
    private final FriendshipRepository friendshipRepository;
    private final BlockedUserRepository blockedUserRepository;
    @Transactional
    public PostDto createPost(Long userId, CreatePostRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = new Post();
        post.setAuthor(author);
        post.setContent(request.getContent());
        post.setPrivacyType(Post.PrivacyType.valueOf(request.getPrivacyType().toUpperCase()));
        post.setMediaUrls(request.getMediaUrls() != null ? request.getMediaUrls() : List.of());
        post.setLocation(request.getLocation());
        post = postRepository.save(post);
        return convertToDto(post, userId);
    }
    @Transactional(readOnly = true)
    public Page<PostDto> getFeed(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Get blocked user IDs
        List<Long> blockedIds = blockedUserRepository.findBlockedUserIdsByBlockerId(userId);
        // Get friend IDs
        List<Long> friendIds = friendshipRepository.findFriendIdsByUserId(userId);
        // Get posts from friends and public posts, excluding blocked users
        Page<Post> posts = postRepository.findVisiblePostsForUser(userId, pageable);
        // Filter out blocked users' posts and hidden posts
        List<Post> filteredPosts = posts.getContent().stream()
                .filter(p -> !blockedIds.contains(p.getAuthor().getId()))
                .filter(p -> p.getIsHidden() == null || !p.getIsHidden()) // Exclude hidden posts
                .collect(Collectors.toList());
        return new PageImpl<>(
                filteredPosts.stream()
                        .map(p -> convertToDto(p, userId))
                        .collect(Collectors.toList()),
                posts.getPageable(),
                posts.getTotalElements()
        );
    }
    @Transactional(readOnly = true)
    public Page<PostDto> getUserPosts(Long authorId, Long currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, pageable);
        // Filter out hidden posts (unless viewing own posts - admin can see hidden posts in admin panel)
        // For regular users, hide posts that are marked as hidden
        List<Post> visiblePosts = posts.getContent().stream()
                .filter(post -> {
                    // If viewing own posts, show all posts (including hidden ones)
                    // Otherwise, filter out hidden posts
                    if (authorId.equals(currentUserId)) {
                        return true; // User can see their own hidden posts
                    }
                    return post.getIsHidden() == null || !post.getIsHidden();
                })
                .collect(Collectors.toList());
        return new PageImpl<>(
                visiblePosts.stream()
                        .map(post -> convertToDto(post, currentUserId))
                        .collect(Collectors.toList()),
                posts.getPageable(),
                visiblePosts.size()
        );
    }
    @Transactional(readOnly = true)
    public PostDto getPostById(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        // Check if post is hidden (unless viewing own post)
        if (post.getIsHidden() != null && post.getIsHidden() && !post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Post not found");
        }
        // Check privacy
        if (!canViewPost(post, userId)) {
            throw new RuntimeException("You don't have permission to view this post");
        }
        return convertToDto(post, userId);
    }
    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts");
        }
        postRepository.delete(post);
    }
    public boolean canViewPost(Post post, Long userId) {
        // Author can always view their own posts
        if (post.getAuthor().getId().equals(userId)) {
            return true;
        }
        // Check privacy settings
        switch (post.getPrivacyType()) {
            case PUBLIC:
                return true;
            case FRIENDS:
                return friendshipRepository.findBetweenUsers(post.getAuthor().getId(), userId).isPresent();
            case PRIVATE:
                return false;
            default:
                return false;
        }
    }
    private PostDto convertToDto(Post post, Long currentUserId) {
        long commentCount = commentRepository.countByPostId(post.getId());
        long reactionCount = postReactionRepository.findByPostId(post.getId()).size();
        String userReaction = postReactionRepository.findByPostId(post.getId()).stream()
                .filter(r -> r.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(r -> r.getReactionType().name())
                .orElse(null);
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
                .userReaction(userReaction)
                .isHidden(post.getIsHidden())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}