package org.example.zaloapi.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * Entity cho cài đặt quyền riêng tư của người dùng
 */
@Entity
@Table(name = "user_privacy_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPrivacySettings {
    @Id
    private Long userId;
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "allow_find_by_phone", nullable = false)
    private Boolean allowFindByPhone = true;
    @Column(name = "allow_friend_request_from_strangers", nullable = false)
    private Boolean allowFriendRequestFromStrangers = true;
    @Column(name = "show_phone_to_friends", nullable = false)
    private Boolean showPhoneToFriends = false;
}