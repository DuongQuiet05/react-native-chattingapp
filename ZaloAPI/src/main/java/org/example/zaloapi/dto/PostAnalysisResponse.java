package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostAnalysisResponse {
    private String analysisType;
    private String summary;
    private Map<String, Object> insights; // Các insights như sentiment distribution, top topics, etc.
    private List<String> keyFindings;
    private List<String> recommendations; // Khuyến nghị hành động cho admin
    private Integer totalPostsAnalyzed;
    private LocalDateTime analyzedAt;
    private String rawAnalysis; // Raw response from Gemini for debugging
}

