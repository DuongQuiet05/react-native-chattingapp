package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.zaloapi.config.GeminiConfig;
import org.example.zaloapi.dto.PostAnalysisResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final GeminiConfig geminiConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    public PostAnalysisResponse analyzePosts(List<PostContent> posts, String analysisType) {
        try {
            if (posts == null || posts.isEmpty()) {
                throw new IllegalArgumentException("Posts list is empty");
            }

            // Validate API key
            if (geminiConfig.getApiKey() == null || geminiConfig.getApiKey().isEmpty() || 
                geminiConfig.getApiKey().equals("your-gemini-api-key-here")) {
                throw new IllegalStateException("Gemini API key is not configured. Please set gemini.api.key in application.properties");
            }

            log.info("Analyzing {} posts with type: {}", posts.size(), analysisType);

            // Build prompt with optimized data
            String prompt = buildAnalysisPrompt(posts, analysisType);
            log.debug("Prompt length: {} characters", prompt.length());

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            content.put("parts", parts);
            contents.add(content);
            requestBody.put("contents", contents);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Try with primary model first, then fallback
            String[] modelsToTry = {
                geminiConfig.getModelName(),
                geminiConfig.getFallbackModelName()
            };

            ParameterizedTypeReference<Map<String, Object>> responseType = 
                new ParameterizedTypeReference<Map<String, Object>>() {};

            ResponseEntity<Map<String, Object>> response = null;
            String lastError = null;
            String usedModel = null;

            // Try each model with retries
            for (String modelName : modelsToTry) {
                if (modelName == null || modelName.isEmpty()) continue;
                
                for (int attempt = 0; attempt < geminiConfig.getMaxRetries(); attempt++) {
                    try {
                        // Build URL with current model
                        String url = String.format(GEMINI_API_URL, modelName, geminiConfig.getApiKey());
                        
                        if (attempt > 0) {
                            log.info("Retry attempt {} for model {}: {}", attempt + 1, modelName, url.replace(geminiConfig.getApiKey(), "***"));
                            // Wait before retry
                            Thread.sleep(geminiConfig.getRetryDelayMs() * (attempt + 1)); // Exponential backoff
                        } else {
                            log.debug("Calling Gemini API with model {}: {}", modelName, url.replace(geminiConfig.getApiKey(), "***"));
                        }

                        // Call Gemini API
                        response = restTemplate.exchange(
                            url, 
                            HttpMethod.POST, 
                            request, 
                            responseType
                        );

                        // Check response status
                        if (response.getStatusCode().is2xxSuccessful()) {
                            usedModel = modelName;
                            break; // Success, exit retry loop
                        } else {
                            log.warn("Gemini API returned non-2xx status: {} for model {}", response.getStatusCode(), modelName);
                            lastError = "Gemini API returned status: " + response.getStatusCode();
                        }

                    } catch (org.springframework.web.client.HttpServerErrorException e) {
                        // 503, 500, etc. - retryable errors
                        if (e.getStatusCode().value() == 503 || e.getStatusCode().value() == 500) {
                            lastError = "Model " + modelName + " is overloaded (503). Attempt " + (attempt + 1) + "/" + geminiConfig.getMaxRetries();
                            log.warn(lastError);
                            if (attempt < geminiConfig.getMaxRetries() - 1) {
                                continue; // Retry
                            }
                        } else {
                            log.error("Gemini API HTTP error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                            lastError = "Gemini API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString();
                            break; // Don't retry for non-retryable errors
                        }
                    } catch (org.springframework.web.client.HttpClientErrorException e) {
                        // 400, 401, 404, etc. - don't retry
                        log.error("Gemini API HTTP error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                        lastError = "Gemini API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString();
                        break;
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Retry interrupted", e);
                    } catch (org.springframework.web.client.RestClientException e) {
                        log.error("Rest client error calling Gemini API with model {}: {}", modelName, e.getMessage());
                        lastError = "Failed to connect to Gemini API: " + e.getMessage();
                        if (attempt < geminiConfig.getMaxRetries() - 1) {
                            continue; // Retry network errors
                        }
                    }
                }

                // If we got a successful response, break out of model loop
                if (response != null && response.getStatusCode().is2xxSuccessful()) {
                    break;
                }
            }

            // Check if we got a successful response
            if (response == null || !response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to analyze posts after trying " + 
                    geminiConfig.getMaxRetries() + " retries with " + modelsToTry.length + " models. " +
                    "Last error: " + lastError + ". The models may be overloaded. Please try again later.");
            }

            // Extract response text
            String responseText = extractTextFromResponse(response.getBody());
            if (responseText == null || responseText.isEmpty() || responseText.startsWith("No")) {
                log.error("Failed to extract text from Gemini response. Response body: {}", response.getBody());
                throw new RuntimeException("Failed to extract analysis from Gemini API response");
            }

            log.info("Successfully received response from Gemini API using model {} (length: {})", usedModel, responseText.length());

            // Parse response
            return parseAnalysisResponse(responseText, analysisType, posts.size());

        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Validation error: {}", e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            log.error("Error calling Gemini API", e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API", e);
            throw new RuntimeException("Failed to analyze posts: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> responseBody) {
        try {
            if (responseBody == null) {
                log.error("Response body is null");
                throw new RuntimeException("No response from Gemini API");
            }

            log.debug("Response body keys: {}", responseBody.keySet());

            // Check for error first
            Object errorObj = responseBody.get("error");
            if (errorObj != null) {
                Map<String, Object> error = errorObj instanceof Map ? (Map<String, Object>) errorObj : null;
                if (error != null) {
                    String errorMessage = (String) error.get("message");
                    String errorCode = error.get("code") != null ? error.get("code").toString() : "UNKNOWN";
                    log.error("Gemini API error: {} - {}", errorCode, errorMessage);
                    throw new RuntimeException("Gemini API error [" + errorCode + "]: " + errorMessage);
                }
            }

            // Navigate through response structure
            Object candidatesObj = responseBody.get("candidates");
            if (candidatesObj == null) {
                log.error("No 'candidates' field in response. Response: {}", responseBody);
                throw new RuntimeException("Invalid response format from Gemini API: missing 'candidates'");
            }
            
            if (!(candidatesObj instanceof List)) {
                log.error("'candidates' is not a List. Type: {}, Value: {}", candidatesObj.getClass(), candidatesObj);
                throw new RuntimeException("Invalid response format from Gemini API: 'candidates' is not a list");
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) candidatesObj;
            if (candidates.isEmpty()) {
                log.error("Candidates list is empty. Response: {}", responseBody);
                throw new RuntimeException("No candidates in Gemini API response");
            }

            Map<String, Object> candidate = candidates.get(0);
            
            // Check for finishReason (might indicate blocking)
            Object finishReasonObj = candidate.get("finishReason");
            if (finishReasonObj != null) {
                String finishReason = finishReasonObj.toString();
                if ("SAFETY".equals(finishReason) || "RECITATION".equals(finishReason)) {
                    log.warn("Gemini blocked content. Finish reason: {}", finishReason);
                    throw new RuntimeException("Content was blocked by Gemini API (finishReason: " + finishReason + ")");
                }
            }
            
            Object contentObj = candidate.get("content");
            if (contentObj == null) {
                log.error("No 'content' in candidate. Candidate: {}", candidate);
                throw new RuntimeException("Invalid response format: missing 'content' in candidate");
            }
            
            if (!(contentObj instanceof Map)) {
                log.error("'content' is not a Map. Type: {}, Value: {}", contentObj.getClass(), contentObj);
                throw new RuntimeException("Invalid response format: 'content' is not a map");
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) contentObj;

            Object partsObj = content.get("parts");
            if (partsObj == null) {
                log.error("No 'parts' in content. Content: {}", content);
                throw new RuntimeException("Invalid response format: missing 'parts' in content");
            }
            
            if (!(partsObj instanceof List)) {
                log.error("'parts' is not a List. Type: {}, Value: {}", partsObj.getClass(), partsObj);
                throw new RuntimeException("Invalid response format: 'parts' is not a list");
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) partsObj;
            if (parts.isEmpty()) {
                log.error("Parts list is empty. Content: {}", content);
                throw new RuntimeException("No parts in Gemini API response content");
            }

            Map<String, Object> part = parts.get(0);
            Object textObj = part.get("text");
            if (textObj == null) {
                log.error("No 'text' in part. Part: {}", part);
                throw new RuntimeException("Invalid response format: missing 'text' in part");
            }
            
            String text = textObj.toString();
            if (text.isEmpty()) {
                log.warn("Text is empty in response");
                throw new RuntimeException("Empty text in Gemini API response");
            }
            
            log.debug("Successfully extracted text (length: {})", text.length());
            return text;

        } catch (RuntimeException e) {
            // Re-throw runtime exceptions
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract text from response", e);
            log.error("Response body: {}", responseBody);
            throw new RuntimeException("Failed to parse Gemini API response: " + e.getMessage(), e);
        }
    }

    private String buildAnalysisPrompt(List<PostContent> posts, String analysisType) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là một chuyên gia phân tích dữ liệu mạng xã hội chuyên nghiệp. ");
        prompt.append("Hãy phân tích ").append(posts.size()).append(" bài đăng gần đây và cung cấp báo cáo ngắn gọn, dễ đọc cho quản trị viên.\n\n");
        
        // Add posts data (optimized - only essential fields)
        prompt.append("=== DỮ LIỆU BÀI ĐĂNG ===\n");
        int displayCount = Math.min(posts.size(), 50); // Only show first 50 in detail to save tokens
        for (int i = 0; i < displayCount; i++) {
            PostContent post = posts.get(i);
            prompt.append(String.format("\n[%d] %s\n", i + 1, truncateContent(post.getContent())));
            prompt.append(String.format("    👤 %s | ❤️ %d | 💬 %d | 📅 %s\n", 
                post.getAuthorName(), 
                post.getReactionCount(), 
                post.getCommentCount(),
                post.getCreatedAt()));
        }
        if (posts.size() > displayCount) {
            prompt.append(String.format("\n... và %d bài đăng khác\n", posts.size() - displayCount));
        }
        
        // Calculate some basic stats for context
        long totalReactions = posts.stream().mapToLong(PostContent::getReactionCount).sum();
        long totalComments = posts.stream().mapToLong(PostContent::getCommentCount).sum();
        double avgReactions = posts.isEmpty() ? 0 : (double) totalReactions / posts.size();
        double avgComments = posts.isEmpty() ? 0 : (double) totalComments / posts.size();
        
        prompt.append(String.format("\n📊 THỐNG KÊ TỔNG QUAN:\n"));
        prompt.append(String.format("- Tổng số bài đăng: %d\n", posts.size()));
        prompt.append(String.format("- Tổng lượt thích: %d (TB: %.1f/bài)\n", totalReactions, avgReactions));
        prompt.append(String.format("- Tổng bình luận: %d (TB: %.1f/bài)\n", totalComments, avgComments));
        
        // Add analysis instructions based on type
        prompt.append("\n=== YÊU CẦU PHÂN TÍCH ===\n");
        switch (analysisType != null ? analysisType.toLowerCase() : "general") {
            case "sentiment":
                prompt.append("Phân tích CẢM XÚC của người dùng:\n");
                prompt.append("1. Phân loại: Tích cực / Tiêu cực / Trung tính\n");
                prompt.append("2. Tính tỷ lệ % cho mỗi loại\n");
                prompt.append("3. Nhận xét về xu hướng cảm xúc tổng thể\n");
                prompt.append("4. Đề xuất hành động (nếu có vấn đề)\n");
                break;
            case "topics":
                prompt.append("Xác định CHỦ ĐỀ chính:\n");
                prompt.append("1. Liệt kê 5-8 chủ đề phổ biến nhất\n");
                prompt.append("2. Số lượng bài đăng mỗi chủ đề\n");
                prompt.append("3. Mô tả ngắn gọn từng chủ đề\n");
                prompt.append("4. Đánh giá mức độ quan tâm\n");
                break;
            case "summary":
                prompt.append("TÓM TẮT nội dung:\n");
                prompt.append("1. Tổng quan các chủ đề chính\n");
                prompt.append("2. Xu hướng và patterns nổi bật\n");
                prompt.append("3. Insights quan trọng nhất\n");
                prompt.append("4. Khuyến nghị cho quản trị viên\n");
                break;
            default:
                prompt.append("PHÂN TÍCH TỔNG HỢP:\n");
                prompt.append("1. Tóm tắt nội dung chính (2-3 câu)\n");
                prompt.append("2. Phân tích cảm xúc tổng thể (tích cực/tiêu cực/trung tính %)\n");
                prompt.append("3. Top 5 chủ đề được quan tâm nhất\n");
                prompt.append("4. Mức độ tương tác (engagement rate)\n");
                prompt.append("5. 3-5 phát hiện quan trọng nhất\n");
                prompt.append("6. Khuyến nghị hành động (nếu cần)\n");
        }
        
        prompt.append("\n=== ĐỊNH DẠNG KẾT QUẢ ===\n");
        prompt.append("Vui lòng trả về kết quả dưới dạng JSON với cấu trúc sau (ngắn gọn, dễ đọc):\n\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": \"Tóm tắt ngắn gọn 2-3 câu về tổng quan bài đăng\",\n");
        prompt.append("  \"insights\": {\n");
        prompt.append("    \"sentiment\": {\"positive\": 45, \"negative\": 15, \"neutral\": 40},\n");
        prompt.append("    \"topTopics\": [\n");
        prompt.append("      {\"name\": \"Tên chủ đề\", \"count\": 25, \"description\": \"Mô tả ngắn\"},\n");
        prompt.append("      ...\n");
        prompt.append("    ],\n");
        prompt.append("    \"engagement\": {\n");
        prompt.append("      \"averageReactions\": 12.5,\n");
        prompt.append("      \"averageComments\": 3.2,\n");
        prompt.append("      \"engagementRate\": \"15%\"\n");
        prompt.append("    }\n");
        prompt.append("  },\n");
        prompt.append("  \"keyFindings\": [\n");
        prompt.append("    \"Phát hiện quan trọng 1 (ngắn gọn, dễ hiểu)\",\n");
        prompt.append("    \"Phát hiện quan trọng 2\",\n");
        prompt.append("    \"Phát hiện quan trọng 3\"\n");
        prompt.append("  ],\n");
        prompt.append("  \"recommendations\": [\n");
        prompt.append("    \"Khuyến nghị hành động 1 (nếu có)\",\n");
        prompt.append("    \"Khuyến nghị hành động 2\"\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("LƯU Ý:\n");
        prompt.append("- Viết ngắn gọn, súc tích, dễ hiểu\n");
        prompt.append("- Sử dụng số liệu cụ thể khi có thể\n");
        prompt.append("- Tránh thuật ngữ kỹ thuật phức tạp\n");
        prompt.append("- Tập trung vào insights có giá trị cho quản trị viên\n");
        prompt.append("- Mỗi keyFinding không quá 1 câu\n");
        
        return prompt.toString();
    }

    private String truncateContent(String content) {
        if (content == null) return "";
        int maxLength = geminiConfig.getMaxContentLength();
        if (content.length() > maxLength) {
            return content.substring(0, maxLength) + "...";
        }
        return content;
    }

    private PostAnalysisResponse parseAnalysisResponse(String response, String analysisType, int totalPosts) {
        try {
            Map<String, Object> insights = new HashMap<>();
            List<String> keyFindings = new ArrayList<>();
            List<String> recommendations = new ArrayList<>();
            String summary = "";

            // Try to parse as JSON first
            try {
                String trimmedResponse = response.trim();
                
                // Remove markdown code blocks if present
                if (trimmedResponse.contains("```json")) {
                    int jsonStart = trimmedResponse.indexOf("```json") + 7;
                    int jsonEnd = trimmedResponse.indexOf("```", jsonStart);
                    if (jsonEnd > jsonStart) {
                        trimmedResponse = trimmedResponse.substring(jsonStart, jsonEnd).trim();
                    }
                } else if (trimmedResponse.contains("```")) {
                    int jsonStart = trimmedResponse.indexOf("```") + 3;
                    int jsonEnd = trimmedResponse.indexOf("```", jsonStart);
                    if (jsonEnd > jsonStart) {
                        trimmedResponse = trimmedResponse.substring(jsonStart, jsonEnd).trim();
                    }
                }
                
                if (trimmedResponse.startsWith("{") && trimmedResponse.contains("\"summary\"")) {
                    // Extract summary
                    int summaryStart = trimmedResponse.indexOf("\"summary\"");
                    if (summaryStart >= 0) {
                        int valueStart = trimmedResponse.indexOf("\"", summaryStart + 10) + 1;
                        int valueEnd = findMatchingQuote(trimmedResponse, valueStart);
                        if (valueEnd > valueStart) {
                            summary = trimmedResponse.substring(valueStart, valueEnd);
                            summary = unescapeJsonString(summary);
                        }
                    }

                    // Extract keyFindings array
                    int findingsStart = trimmedResponse.indexOf("\"keyFindings\"");
                    if (findingsStart >= 0) {
                        int arrayStart = trimmedResponse.indexOf("[", findingsStart);
                        int arrayEnd = findMatchingBracket(trimmedResponse, arrayStart, '[', ']');
                        if (arrayEnd > arrayStart) {
                            String findingsStr = trimmedResponse.substring(arrayStart + 1, arrayEnd);
                            extractJsonArray(findingsStr, keyFindings);
                        }
                    }

                    // Extract recommendations array
                    int recStart = trimmedResponse.indexOf("\"recommendations\"");
                    if (recStart >= 0) {
                        int arrayStart = trimmedResponse.indexOf("[", recStart);
                        int arrayEnd = findMatchingBracket(trimmedResponse, arrayStart, '[', ']');
                        if (arrayEnd > arrayStart) {
                            String recStr = trimmedResponse.substring(arrayStart + 1, arrayEnd);
                            extractJsonArray(recStr, recommendations);
                        }
                    }

                    // Extract insights object
                    int insightsStart = trimmedResponse.indexOf("\"insights\"");
                    if (insightsStart >= 0) {
                        int objStart = trimmedResponse.indexOf("{", insightsStart);
                        int objEnd = findMatchingBracket(trimmedResponse, objStart, '{', '}');
                        if (objEnd > objStart) {
                            String insightsStr = trimmedResponse.substring(objStart, objEnd + 1);
                            // Parse sentiment
                            if (insightsStr.contains("\"sentiment\"")) {
                                Map<String, Object> sentiment = new HashMap<>();
                                extractSentimentData(insightsStr, sentiment);
                                insights.put("sentiment", sentiment);
                            }
                            // Parse topTopics
                            if (insightsStr.contains("\"topTopics\"")) {
                                List<Map<String, Object>> topics = new ArrayList<>();
                                extractTopicsData(insightsStr, topics);
                                insights.put("topTopics", topics);
                            }
                            // Parse engagement
                            if (insightsStr.contains("\"engagement\"")) {
                                Map<String, Object> engagement = new HashMap<>();
                                extractEngagementData(insightsStr, engagement);
                                insights.put("engagement", engagement);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Failed to parse JSON structure, will use full response as summary", e);
            }

            // If summary is still empty or parsing failed, use the full response
            if (summary.isEmpty()) {
                // Try to extract summary from text format
                String[] lines = response.split("\n");
                for (String line : lines) {
                    line = line.trim();
                    if (line.length() > 50 && line.length() < 500 && 
                        (line.toLowerCase().contains("tổng quan") || 
                         line.toLowerCase().contains("tóm tắt") ||
                         line.toLowerCase().contains("phân tích"))) {
                        summary = line;
                        break;
                    }
                }
                
                // If still empty, use first meaningful paragraph
                if (summary.isEmpty()) {
                    for (String line : lines) {
                        line = line.trim();
                        if (line.length() > 100 && !line.startsWith("#") && !line.startsWith("```")) {
                            summary = line.length() > 300 ? line.substring(0, 300) + "..." : line;
                            break;
                        }
                    }
                }
                
                // Last resort: use first 500 chars
                if (summary.isEmpty()) {
                    summary = response.length() > 500 
                        ? response.substring(0, 500) + "..." 
                        : response;
                }
            }

            // If no key findings extracted, try to extract from text
            if (keyFindings.isEmpty() && response.length() > 100) {
                String[] lines = response.split("\n");
                for (String line : lines) {
                    line = line.trim();
                    if ((line.startsWith("- ") || line.startsWith("• ") || line.matches("^\\d+\\.\\s+.*")) 
                        && line.length() > 15 && line.length() < 200) {
                        String finding = line.replaceFirst("^[-•]\\s*", "").replaceFirst("^\\d+\\.\\s*", "");
                        if (!finding.isEmpty() && !finding.toLowerCase().contains("keyfinding")) {
                            keyFindings.add(finding);
                            if (keyFindings.size() >= 8) break; // Limit to 8 findings
                        }
                    }
                }
            }

            return PostAnalysisResponse.builder()
                    .analysisType(analysisType != null ? analysisType : "general")
                    .summary(summary)
                    .insights(insights)
                    .keyFindings(keyFindings)
                    .recommendations(recommendations)
                    .totalPostsAnalyzed(totalPosts)
                    .analyzedAt(java.time.LocalDateTime.now())
                    .rawAnalysis(response)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse analysis response", e);
            // Return response with raw text as fallback
            return PostAnalysisResponse.builder()
                    .analysisType(analysisType != null ? analysisType : "general")
                    .summary(response.length() > 500 ? response.substring(0, 500) + "..." : response)
                    .insights(new HashMap<>())
                    .keyFindings(List.of())
                    .recommendations(List.of())
                    .totalPostsAnalyzed(totalPosts)
                    .analyzedAt(java.time.LocalDateTime.now())
                    .rawAnalysis(response)
                    .build();
        }
    }

    // Helper methods for JSON parsing
    private int findMatchingQuote(String str, int start) {
        for (int i = start; i < str.length(); i++) {
            if (str.charAt(i) == '"' && (i == start || str.charAt(i - 1) != '\\')) {
                return i;
            }
        }
        return -1;
    }

    private int findMatchingBracket(String str, int start, char open, char close) {
        int depth = 1;
        for (int i = start + 1; i < str.length(); i++) {
            char c = str.charAt(i);
            if (c == open) depth++;
            else if (c == close) {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private void extractJsonArray(String arrayStr, List<String> result) {
        if (arrayStr == null || arrayStr.trim().isEmpty()) return;
        String[] items = arrayStr.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (String item : items) {
            item = item.trim();
            if (item.startsWith("\"") && item.endsWith("\"")) {
                item = item.substring(1, item.length() - 1);
            }
            item = unescapeJsonString(item);
            if (!item.isEmpty() && item.length() < 300) {
                result.add(item);
            }
        }
    }

    private String unescapeJsonString(String str) {
        return str.replace("\\n", "\n")
                  .replace("\\\"", "\"")
                  .replace("\\t", "\t")
                  .replace("\\\\", "\\");
    }

    private void extractSentimentData(String insightsStr, Map<String, Object> sentiment) {
        extractNumber(insightsStr, "\"positive\"", sentiment, "positive");
        extractNumber(insightsStr, "\"negative\"", sentiment, "negative");
        extractNumber(insightsStr, "\"neutral\"", sentiment, "neutral");
    }

    private void extractTopicsData(String insightsStr, List<Map<String, Object>> topics) {
        // Simple extraction - look for topic objects
        String[] topicBlocks = insightsStr.split("\\{");
        for (String block : topicBlocks) {
            if (block.contains("\"name\"") && block.contains("\"count\"")) {
                Map<String, Object> topic = new HashMap<>();
                extractString(block, "\"name\"", topic, "name");
                extractNumber(block, "\"count\"", topic, "count");
                extractString(block, "\"description\"", topic, "description");
                if (!topic.isEmpty()) {
                    topics.add(topic);
                }
            }
        }
    }

    private void extractEngagementData(String insightsStr, Map<String, Object> engagement) {
        extractNumber(insightsStr, "\"averageReactions\"", engagement, "averageReactions");
        extractNumber(insightsStr, "\"averageComments\"", engagement, "averageComments");
        extractString(insightsStr, "\"engagementRate\"", engagement, "engagementRate");
    }

    private void extractString(String str, String key, Map<String, Object> map, String mapKey) {
        int keyPos = str.indexOf(key);
        if (keyPos >= 0) {
            int valueStart = str.indexOf("\"", keyPos + key.length()) + 1;
            int valueEnd = findMatchingQuote(str, valueStart);
            if (valueEnd > valueStart) {
                String value = unescapeJsonString(str.substring(valueStart, valueEnd));
                map.put(mapKey, value);
            }
        }
    }

    private void extractNumber(String str, String key, Map<String, Object> map, String mapKey) {
        int keyPos = str.indexOf(key);
        if (keyPos >= 0) {
            int valueStart = keyPos + key.length();
            while (valueStart < str.length() && (str.charAt(valueStart) == ' ' || str.charAt(valueStart) == ':')) {
                valueStart++;
            }
            int valueEnd = valueStart;
            while (valueEnd < str.length() && 
                   (Character.isDigit(str.charAt(valueEnd)) || str.charAt(valueEnd) == '.')) {
                valueEnd++;
            }
            if (valueEnd > valueStart) {
                try {
                    String numStr = str.substring(valueStart, valueEnd);
                    if (numStr.contains(".")) {
                        map.put(mapKey, Double.parseDouble(numStr));
                    } else {
                        map.put(mapKey, Long.parseLong(numStr));
                    }
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }
    }

    // Inner class for optimized post data
    public static class PostContent {
        private String content;
        private String authorName;
        private String createdAt;
        private long reactionCount;
        private long commentCount;

        public PostContent(String content, String authorName, String createdAt, long reactionCount, long commentCount) {
            this.content = content;
            this.authorName = authorName;
            this.createdAt = createdAt;
            this.reactionCount = reactionCount;
            this.commentCount = commentCount;
        }

        // Getters
        public String getContent() { return content; }
        public String getAuthorName() { return authorName; }
        public String getCreatedAt() { return createdAt; }
        public long getReactionCount() { return reactionCount; }
        public long getCommentCount() { return commentCount; }
    }
}

