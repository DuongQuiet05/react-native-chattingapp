package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStoryRequest {
    private String imageUrl;
    private String videoUrl;
    private String musicUrl;
    private String musicTitle;
    private String textOverlay;
}

