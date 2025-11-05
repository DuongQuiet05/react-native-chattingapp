package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String status;
    private LocalDateTime lastSeen;
}

