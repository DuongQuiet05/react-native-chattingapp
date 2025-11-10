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
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String dateOfBirth;
    private String gender;
    private String status;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
}