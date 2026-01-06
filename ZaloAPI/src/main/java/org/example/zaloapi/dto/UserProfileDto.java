package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    // Basic Info
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    
    // Profile Details
    private String bio;
    private String dateOfBirth;
    private String gender;
    
    // Contact Info
    private String phoneNumber;
    private Boolean isPhoneVerified;
    
    // Status & Role
    private String status;
    private String role;
    private Boolean isBlocked;
    
    // Timestamps
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}