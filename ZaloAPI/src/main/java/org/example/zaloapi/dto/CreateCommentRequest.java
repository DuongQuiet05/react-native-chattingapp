package org.example.zaloapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {
    @NotNull(message = "Post ID is required")
    private Long postId;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private Long parentCommentId; // For replies
}

