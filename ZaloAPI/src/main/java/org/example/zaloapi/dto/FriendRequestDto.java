package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho lời mời kết bạn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDto {
    private Long id;
    private UserBasicDto sender;
    private UserBasicDto receiver;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

