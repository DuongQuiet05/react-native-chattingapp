package org.example.zaloapi.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    @NotBlank(message = "Content is required")
    private String content;
    
    private String privacyType = "PUBLIC"; // PUBLIC, FRIENDS, PRIVATE
    
    private List<String> mediaUrls;
    
    private String location;
}

