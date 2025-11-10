package org.example.zaloapi.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String username;
    @Column(name = "phone_number", unique = true, nullable = false)
    private String phoneNumber;
    @Column(name = "is_phone_verified", nullable = false)
    private Boolean isPhoneVerified = false;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "display_name")
    private String displayName;
    @Column(name = "avatar_url")
    private String avatarUrl;
    @Column(columnDefinition = "TEXT")
    private String bio;
    @Column(name = "date_of_birth")
    private String dateOfBirth;
    @Column(name = "gender")
    private String gender;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.OFFLINE;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;
    @Column(name = "is_blocked", nullable = false)
    private Boolean isBlocked = false;
    @Column(name = "last_seen")
    private LocalDateTime lastSeen;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    public enum UserStatus {
        ONLINE, OFFLINE, AWAY
    }
    public enum UserRole {
        USER, ADMIN
    }
}