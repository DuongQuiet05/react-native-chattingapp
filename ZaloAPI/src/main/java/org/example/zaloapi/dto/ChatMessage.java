package org.example.zaloapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatMessage {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String messageType;
    private LocalDateTime sentAt;
    private MessageAction action; // SEND, TYPING, READ, DELIVERED
    
    // File attachment fields
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private String thumbnailUrl;

    public enum MessageAction {
        SEND, TYPING, READ, DELIVERED
    }
}
