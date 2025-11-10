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
public class NotificationDto {
    private Long id;
    private String notificationType;
    private String title;
    private String content;
    private Long relatedEntityId;
    private String relatedEntityType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}