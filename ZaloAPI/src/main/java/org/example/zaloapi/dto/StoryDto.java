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
public class StoryDto {
    private Long id;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String imageUrl;
    private String videoUrl;
    private String musicUrl;
    private String musicTitle;
    private String textOverlay;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Long viewCount;
    private Boolean isViewed;
    private Boolean isOwn;
}

