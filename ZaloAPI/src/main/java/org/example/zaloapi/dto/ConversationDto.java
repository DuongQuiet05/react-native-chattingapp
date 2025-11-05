package org.example.zaloapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConversationDto {
    private Long id;
    private String type;
    private String groupName;
    private String groupAvatarUrl;
    private Long createdBy;
    private LocalDateTime createdAt;
    private List<UserDto> participants;
    private MessageDto lastMessage;
}

