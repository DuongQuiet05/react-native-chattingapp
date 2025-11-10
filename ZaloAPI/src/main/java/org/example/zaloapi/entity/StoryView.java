package org.example.zaloapi.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity
@Table(name = "story_views", indexes = {
    @Index(name = "idx_story_user", columnList = "story_id,user_id"),
    @Index(name = "idx_story_id", columnList = "story_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"story_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoryView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @CreationTimestamp
    @Column(name = "viewed_at", updatable = false)
    private LocalDateTime viewedAt;
}

