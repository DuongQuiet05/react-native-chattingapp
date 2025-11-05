package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cơ bản cho thông tin user (dùng chung)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBasicDto {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String status;
}

