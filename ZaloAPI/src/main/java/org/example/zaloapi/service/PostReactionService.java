package org.example.zaloapi.service;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.PostDto;
import org.example.zaloapi.dto.ReactToPostRequest;
import org.example.zaloapi.entity.Post;
import org.example.zaloapi.entity.PostReaction;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.PostReactionRepository;
import org.example.zaloapi.repository.PostRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
@Service
@RequiredArgsConstructor
public class PostReactionService {
    private final PostReactionRepository postReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PushNotificationService pushNotificationService;
    @Transactional
    public PostDto reactToPost(Long postId, Long userId, ReactToPostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PostReaction.ReactionType type = PostReaction.ReactionType.valueOf(request.getReactionType().toUpperCase());
        // Check if user already reacted with this type
        Optional<PostReaction> existing = postReactionRepository
                .findByPostIdAndUserIdAndReactionType(postId, userId, type);
        Long postAuthorId = post.getAuthor().getId();
        if (existing.isPresent()) {
            // Remove reaction if same type (toggle)
            postReactionRepository.delete(existing.get());
        } else {
            // Remove any existing reaction of different type
            postReactionRepository.findByPostId(postId).stream()
                    .filter(r -> r.getUser().getId().equals(userId))
                    .forEach(postReactionRepository::delete);
            // Create new reaction
            PostReaction reaction = new PostReaction();
            reaction.setPost(post);
            reaction.setUser(user);
            reaction.setReactionType(type);
            postReactionRepository.save(reaction);
            // Create notification for post author
            // Don't notify if reacting to own post
            if (!postAuthorId.equals(userId)) {
                try {
                    String reactionText = getReactionText(type);
                    notificationService.createNotification(
                        postAuthorId,
                        org.example.zaloapi.entity.Notification.NotificationType.POST_REACTION,
                        "@" + user.getUsername() + " " + reactionText + " your post",
                        user.getDisplayName() + " " + reactionText + " your post",
                        postId,
                        "POST"
                    );
                    pushNotificationService.sendPostReactionNotification(
                        postAuthorId,
                        user.getDisplayName(),
                        reactionText,
                        postId
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to create post reaction notification: " + e.getMessage());
                }
            }
        }
        // Return updated post DTO
        // Note: This would typically be handled by PostService
        return null; // Will be handled by PostService
    }
    @Transactional
    public void removeReaction(Long postId, Long userId) {
        postReactionRepository.findByPostId(postId).stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .forEach(postReactionRepository::delete);
    }
    private String getReactionText(PostReaction.ReactionType type) {
        switch (type) {
            case LIKE:
                return "liked";
            case LOVE:
                return "loved";
            case HAHA:
                return "laughed at";
            case WOW:
                return "wowed";
            case SAD:
                return "saddened";
            case ANGRY:
                return "got angry at";
            default:
                return "reacted to";
        }
    }
}