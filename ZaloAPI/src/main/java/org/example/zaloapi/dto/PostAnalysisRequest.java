package org.example.zaloapi.dto;

import lombok.Data;

@Data
public class PostAnalysisRequest {
    private Integer maxPosts; // Optional: số lượng posts tối đa để phân tích (default: 200)
    private String analysisType; // Optional: loại phân tích (sentiment, topics, summary, etc.)
}

