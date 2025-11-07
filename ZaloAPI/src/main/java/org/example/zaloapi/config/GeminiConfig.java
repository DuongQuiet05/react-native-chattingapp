package org.example.zaloapi.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class GeminiConfig {
    
    @Value("${gemini.api.key}")
    private String apiKey;
    
    @Value("${gemini.model.name:gemini-1.5-flash}")
    private String modelName;
    
    @Value("${gemini.fallback.model.name:gemini-1.5-pro}")
    private String fallbackModelName;
    
    @Value("${gemini.max-retries:3}")
    private Integer maxRetries;
    
    @Value("${gemini.retry-delay-ms:2000}")
    private Long retryDelayMs;
    
    @Value("${gemini.max-posts-to-analyze:200}")
    private Integer maxPostsToAnalyze;
    
    @Value("${gemini.max-content-length:500}")
    private Integer maxContentLength;
}

