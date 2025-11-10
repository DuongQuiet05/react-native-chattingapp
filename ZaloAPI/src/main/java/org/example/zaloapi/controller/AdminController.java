package org.example.zaloapi.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.PostAnalysisRequest;
import org.example.zaloapi.dto.PostAnalysisResponse;
import org.example.zaloapi.dto.PostDto;
import org.example.zaloapi.dto.UpdateProfileRequest;
import org.example.zaloapi.dto.UserDto;
import org.example.zaloapi.dto.UserProfileDto;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.AdminService;
import org.example.zaloapi.service.GeminiService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management APIs")
public class AdminController {
    private final AdminService adminService;
    private final GeminiService geminiService;
    // User Management Endpoints
    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Get paginated list of all users with optional search")
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size, search));
    }
    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user by ID", description = "Get user details by ID")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }
    @PutMapping("/users/{userId}/status")
    @Operation(summary = "Update user status", description = "Update user status (ONLINE/OFFLINE/AWAY)")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam String status) {
        User.UserStatus userStatus = User.UserStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(adminService.updateUserStatus(userId, userStatus));
    }
    @PutMapping("/users/{userId}/profile")
    @Operation(summary = "Update user profile", description = "Update user profile information")
    public ResponseEntity<UserProfileDto> updateUserProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(adminService.updateUserProfile(userId, request));
    }
    @PostMapping("/users/{userId}/block")
    @Operation(summary = "Block user", description = "Block a user account")
    public ResponseEntity<Map<String, Object>> blockUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            adminService.blockUser(userId, currentUser.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User blocked successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to block user"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    @PostMapping("/users/{userId}/unblock")
    @Operation(summary = "Unblock user", description = "Unblock a user account")
    public ResponseEntity<Map<String, Object>> unblockUser(@PathVariable Long userId) {
        try {
            adminService.unblockUser(userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User unblocked successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to unblock user"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    // Post Management Endpoints
    @GetMapping("/posts")
    @Operation(summary = "Get all posts", description = "Get paginated list of all posts with optional search")
    public ResponseEntity<Page<PostDto>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getAllPosts(page, size, search));
    }
    @GetMapping("/posts/{postId}")
    @Operation(summary = "Get post by ID", description = "Get post details by ID")
    public ResponseEntity<PostDto> getPostById(@PathVariable Long postId) {
        return ResponseEntity.ok(adminService.getPostById(postId));
    }
    @GetMapping("/users/{userId}/posts")
    @Operation(summary = "Get user posts", description = "Get all posts by a specific user")
    public ResponseEntity<Page<PostDto>> getPostsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getPostsByUser(userId, page, size));
    }
    @DeleteMapping("/posts/{postId}")
    @Operation(summary = "Delete post", description = "Delete a post")
    public ResponseEntity<Map<String, Object>> deletePost(@PathVariable Long postId) {
        adminService.deletePost(postId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Post deleted successfully"
        ));
    }
    @PostMapping("/posts/{postId}/hide")
    @Operation(summary = "Hide post", description = "Hide a post")
    public ResponseEntity<Map<String, Object>> hidePost(@PathVariable Long postId) {
        adminService.hidePost(postId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Post hidden successfully"
        ));
    }
    @PostMapping("/posts/{postId}/unhide")
    @Operation(summary = "Unhide post", description = "Unhide a post")
    public ResponseEntity<Map<String, Object>> unhidePost(@PathVariable Long postId) {
        adminService.unhidePost(postId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Post unhidden successfully"
        ));
    }
    // Statistics Endpoints
    @GetMapping("/stats")
    @Operation(summary = "Get statistics", description = "Get admin dashboard statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", adminService.getTotalUsers(),
                "totalPosts", adminService.getTotalPosts(),
                "totalConversations", adminService.getTotalConversations()
        ));
    }
    // Post Analysis Endpoints
    @PostMapping("/posts/analyze")
    @Operation(summary = "Analyze posts", description = "Analyze 100-200 recent posts using AI (Gemini)")
    public ResponseEntity<PostAnalysisResponse> analyzePosts(@RequestBody(required = false) PostAnalysisRequest request) {
        try {
            // Default to 150 posts (between 100-200 range)
            Integer maxPosts = (request != null && request.getMaxPosts() != null) 
                    ? request.getMaxPosts() 
                    : 150;
            // Ensure maxPosts is between 100-200
            maxPosts = Math.max(100, Math.min(maxPosts, 200));
            String analysisType = (request != null && request.getAnalysisType() != null) 
                    ? request.getAnalysisType() 
                    : "general";
            // Get optimized post data (100-200 most recent posts)
            List<org.example.zaloapi.service.GeminiService.PostContent> posts = adminService.getPostsForAnalysis(maxPosts);
            if (posts.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        PostAnalysisResponse.builder()
                                .analysisType(analysisType)
                                .summary("Không có bài đăng nào để phân tích. Vui lòng đảm bảo có ít nhất 1 bài đăng trong hệ thống.")
                                .insights(Map.of())
                                .keyFindings(List.of())
                                .recommendations(List.of())
                                .totalPostsAnalyzed(0)
                                .analyzedAt(java.time.LocalDateTime.now())
                                .rawAnalysis("")
                                .build()
                );
            }
            // Log analysis request
            org.slf4j.LoggerFactory.getLogger(AdminController.class)
                .info("Starting analysis of {} posts with type: {}", posts.size(), analysisType);
            // Analyze using Gemini
            PostAnalysisResponse analysis = geminiService.analyzePosts(posts, analysisType);
            return ResponseEntity.ok(analysis);
        } catch (IllegalArgumentException | IllegalStateException e) {
            // Validation errors - return 400
            return ResponseEntity.badRequest().body(
                    PostAnalysisResponse.builder()
                            .analysisType(request != null && request.getAnalysisType() != null ? request.getAnalysisType() : "general")
                            .summary("Lỗi cấu hình: " + e.getMessage())
                            .insights(Map.of())
                            .keyFindings(List.of())
                            .recommendations(List.of())
                            .totalPostsAnalyzed(0)
                            .analyzedAt(java.time.LocalDateTime.now())
                            .rawAnalysis("")
                            .build()
            );
        } catch (Exception e) {
            // Log full error for debugging
            org.slf4j.LoggerFactory.getLogger(AdminController.class)
                .error("Error analyzing posts", e);
            return ResponseEntity.status(500).body(
                    PostAnalysisResponse.builder()
                            .analysisType(request != null && request.getAnalysisType() != null ? request.getAnalysisType() : "general")
                            .summary("Lỗi khi phân tích: " + e.getMessage() + 
                                    (e.getCause() != null ? " (" + e.getCause().getMessage() + ")" : ""))
                            .insights(Map.of())
                            .keyFindings(List.of())
                            .recommendations(List.of())
                            .totalPostsAnalyzed(0)
                            .analyzedAt(java.time.LocalDateTime.now())
                            .rawAnalysis("")
                            .build()
            );
        }
    }
}