package org.example.zaloapi.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
/**
 * Entity cho thông báo
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_user_created", columnList = "user_id,created_at"),
    @Index(name = "idx_user_read", columnList = "user_id,is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    @Column(name = "related_entity_id")
    private Long relatedEntityId; // ID of related entity (message, post, friend_request, etc.)
    @Column(name = "related_entity_type")
    private String relatedEntityType; // Type: MESSAGE, POST, FRIEND_REQUEST, etc.
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    public enum NotificationType {
        MESSAGE,           // Tin nhắn mới
        MESSAGE_REACTION,  // Reaction tin nhắn
        FRIEND_REQUEST,    // Yêu cầu kết bạn
        FRIEND_ACCEPTED,   // Đã chấp nhận kết bạn
        POST_COMMENT,      // Bình luận bài viết
        POST_REACTION,     // Reaction bài viết
        COMMENT_REPLY      // Trả lời bình luận
    }
}