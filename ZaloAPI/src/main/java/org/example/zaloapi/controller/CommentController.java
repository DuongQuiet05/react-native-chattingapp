package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.CommentDto;
import org.example.zaloapi.dto.CreateCommentRequest;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.CommentService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Comments", description = "Comment management APIs")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Create comment", description = "Create a new comment")
    public ResponseEntity<CommentDto> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(commentService.createComment(currentUser.getId(), request));
    }

    @GetMapping("/post/{postId}")
    @Operation(summary = "Get post comments", description = "Get all comments for a post")
    public ResponseEntity<Map<String, Object>> getPostComments(@PathVariable Long postId) {
        return ResponseEntity.ok(Map.of(
                "comments", commentService.getPostComments(postId)
        ));
    }

    @GetMapping("/post/{postId}/paginated")
    @Operation(summary = "Get post comments (paginated)", description = "Get paginated comments for a post")
    public ResponseEntity<Page<CommentDto>> getPostCommentsPaginated(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(commentService.getPostCommentsPaginated(postId, page, size));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete comment", description = "Delete a comment")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        commentService.deleteComment(commentId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Comment deleted successfully"
        ));
    }
}

