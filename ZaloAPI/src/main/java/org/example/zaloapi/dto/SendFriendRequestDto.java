package org.example.zaloapi.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO để gửi lời mời kết bạn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendFriendRequestDto {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @Size(max = 500, message = "Message must be less than 500 characters")
    private String message;
}

