package org.example.zaloapi.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data
public class SendMessageRequest {
    @NotNull(message = "Conversation ID is required")
    private Long conversationId;
    private String content; // Optional for file messages
    private String messageType = "TEXT"; // TEXT, IMAGE, VIDEO, FILE
    // File attachment fields
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private String thumbnailUrl;
}