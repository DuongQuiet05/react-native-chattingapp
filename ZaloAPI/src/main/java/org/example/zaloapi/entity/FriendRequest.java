package org.example.zaloapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity cho lời mời kết bạn
 */
@Entity
@Table(name = "friend_requests", indexes = {
    @Index(name = "idx_sender_receiver", columnList = "sender_id,receiver_id"),
    @Index(name = "idx_receiver_status", columnList = "receiver_id,status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(length = 500)
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RequestStatus {
        PENDING,    // Đang chờ xử lý
        ACCEPTED,   // Đã chấp nhận
        REJECTED    // Đã từ chối
    }
}

