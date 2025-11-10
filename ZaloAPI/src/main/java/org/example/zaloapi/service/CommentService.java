package org.example.zaloapi.service;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.CommentDto;
import org.example.zaloapi.dto.CreateCommentRequest;
import org.example.zaloapi.entity.Comment;
import org.example.zaloapi.entity.Post;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.CommentRepository;
import org.example.zaloapi.repository.FriendshipRepository;
import org.example.zaloapi.repository.PostRepository;
import org.example.zaloapi.repository.UserRepository;
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
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final NotificationService notificationService;
    private final PushNotificationService pushNotificationService;
    @Transactional
    public CommentDto createComment(Long userId, CreateCommentRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        // Check if user can view the post (which means they can comment)
        if (!canViewPost(post, userId)) {
            throw new RuntimeException("You don't have permission to comment on this post");
        }
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(request.getContent());
        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParentComment(parentComment);
        }
        comment = commentRepository.save(comment);
        // Create notification
        Long postAuthorId = post.getAuthor().getId();
        if (parentComment != null) {
            // Reply to comment - notify comment author (not the post author)
            Long parentCommentAuthorId = parentComment.getAuthor().getId();
            // Don't notify if replying to own comment
            if (!parentCommentAuthorId.equals(userId)) {
                try {
                    notificationService.createNotification(
                        parentCommentAuthorId,
                        org.example.zaloapi.entity.Notification.NotificationType.COMMENT_REPLY,
                        "@" + author.getUsername() + " replied to your comment",
                        author.getDisplayName() + " replied to your comment",
                        post.getId(), // Use postId instead of commentId for navigation
                        "POST"
                    );
                    pushNotificationService.sendCommentReplyNotification(
                        parentCommentAuthorId,
                        author.getDisplayName(),
                        comment.getId()
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to create comment reply notification: " + e.getMessage());
                }
            }
        } else {
            // Comment on post - notify post author
            // Don't notify if commenting on own post
            if (!postAuthorId.equals(userId)) {
                try {
                    notificationService.createNotification(
                        postAuthorId,
                        org.example.zaloapi.entity.Notification.NotificationType.POST_COMMENT,
                        "@" + author.getUsername() + " commented on your post",
                        author.getDisplayName() + " commented on your post",
                        post.getId(),
                        "POST"
                    );
                    pushNotificationService.sendPostCommentNotification(
                        postAuthorId,
                        author.getDisplayName(),
                        post.getId()
                    );
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to create post comment notification: " + e.getMessage());
                }
            }
        }
        return convertToDto(comment);
    }
    @Transactional(readOnly = true)
    public List<CommentDto> getPostComments(Long postId) {
        List<Comment> topLevelComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .filter(c -> c.getParentComment() == null)
                .collect(Collectors.toList());
        return topLevelComments.stream()
                .map(this::convertToDtoWithReplies)
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public Page<CommentDto> getPostCommentsPaginated(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId, pageable);
        return comments.map(this::convertToDto);
    }
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }
    private CommentDto convertToDto(Comment comment) {
        return CommentDto.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getDisplayName())
                .authorAvatar(comment.getAuthor().getAvatarUrl())
                .content(comment.getContent())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
    private boolean canViewPost(Post post, Long userId) {
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
    private CommentDto convertToDtoWithReplies(Comment comment) {
        CommentDto dto = convertToDto(comment);
        List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId());
        List<CommentDto> replyDtos = replies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        dto.setReplies(replyDtos);
        return dto;
    }
}