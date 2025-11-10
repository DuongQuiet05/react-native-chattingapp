package org.example.zaloapi.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
/**
 * Entity để lưu FCM device tokens cho push notifications
 */
@Entity
@Table(name = "devices", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "device_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "fcm_token", nullable = false, length = 500)
    private String fcmToken;
    @Column(name = "device_id")
    private String deviceId; // Unique device identifier
    @Column(name = "device_type")
    @Enumerated(EnumType.STRING)
    private DeviceType deviceType;
    @Column(name = "app_version")
    private String appVersion;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    public enum DeviceType {
        ANDROID,
        IOS,
        WEB
    }
}