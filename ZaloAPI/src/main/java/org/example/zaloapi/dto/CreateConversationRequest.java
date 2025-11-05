package org.example.zaloapi.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateConversationRequest {
    @NotNull(message = "Type is required")
    private String type; // PRIVATE or GROUP

    private String groupName;

    @NotEmpty(message = "Participant IDs are required")
    private List<Long> participantIds;
}

