package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedUserDto {
    private Long id;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private LocalDateTime blockedAt;
}

