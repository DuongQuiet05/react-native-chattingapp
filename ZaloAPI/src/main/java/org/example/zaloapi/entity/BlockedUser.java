package org.example.zaloapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity cho việc chặn người dùng
 */
@Entity
@Table(name = "blocked_users", indexes = {
    @Index(name = "idx_blocker_blocked", columnList = "blocker_id,blocked_id", unique = true),
    @Index(name = "idx_blocker", columnList = "blocker_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    @CreationTimestamp
    @Column(name = "blocked_at", updatable = false)
    private LocalDateTime blockedAt;
}

