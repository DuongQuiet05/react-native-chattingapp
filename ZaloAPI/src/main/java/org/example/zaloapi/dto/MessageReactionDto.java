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
public class MessageReactionDto {
    private Long id;
    private Long messageId;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String reactionType;
    private LocalDateTime createdAt;
}