package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDto {
    private Long id;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private String privacyType;
    private List<String> mediaUrls;
    private String location;
    private long commentCount;
    private long reactionCount;
    private String userReaction; // Current user's reaction type, null if none
    private Boolean isHidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}