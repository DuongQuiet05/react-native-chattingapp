package org.example.zaloapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity cho bài viết (post)
 */
@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_author_created", columnList = "author_id,created_at"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_type", nullable = false)
    private PrivacyType privacyType = PrivacyType.PUBLIC;

    // Media attachments
    @ElementCollection
    @CollectionTable(name = "post_media", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "media_url")
    private List<String> mediaUrls = new ArrayList<>();

    @Column(name = "location")
    private String location;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum PrivacyType {
        PUBLIC,      // Mọi người
        FRIENDS,     // Chỉ bạn bè
        PRIVATE      // Chỉ mình tôi
    }
}

