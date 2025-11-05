package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.*;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.CommentService;
import org.example.zaloapi.service.PostReactionService;
import org.example.zaloapi.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Posts", description = "Post management APIs")
public class PostController {

    private final PostService postService;
    private final PostReactionService postReactionService;
    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Create post", description = "Create a new post")
    public ResponseEntity<PostDto> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(postService.createPost(currentUser.getId(), request));
    }

    @GetMapping("/feed")
    @Operation(summary = "Get feed", description = "Get feed of posts")
    public ResponseEntity<Page<PostDto>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(postService.getFeed(currentUser.getId(), page, size));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user posts", description = "Get posts by a specific user")
    public ResponseEntity<Page<PostDto>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(postService.getUserPosts(userId, currentUser.getId(), page, size));
    }

    @GetMapping("/{postId}")
    @Operation(summary = "Get post by ID", description = "Get a specific post by ID")
    public ResponseEntity<PostDto> getPostById(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(postService.getPostById(postId, currentUser.getId()));
    }

    @DeleteMapping("/{postId}")
    @Operation(summary = "Delete post", description = "Delete a post")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        postService.deletePost(postId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Post deleted successfully"
        ));
    }

    @PostMapping("/{postId}/reactions")
    @Operation(summary = "React to post", description = "Add or toggle reaction to a post")
    public ResponseEntity<Map<String, Object>> reactToPost(
            @PathVariable Long postId,
            @Valid @RequestBody ReactToPostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        postReactionService.reactToPost(postId, currentUser.getId(), request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reaction updated"
        ));
    }

    @DeleteMapping("/{postId}/reactions")
    @Operation(summary = "Remove reaction", description = "Remove reaction from a post")
    public ResponseEntity<Map<String, Object>> removeReaction(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        postReactionService.removeReaction(postId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reaction removed"
        ));
    }

    @GetMapping("/{postId}/comments")
    @Operation(summary = "Get post comments", description = "Get all comments for a post")
    public ResponseEntity<Map<String, Object>> getPostComments(@PathVariable Long postId) {
        return ResponseEntity.ok(Map.of(
                "comments", commentService.getPostComments(postId)
        ));
    }

    @PostMapping("/{postId}/comments")
    @Operation(summary = "Comment on post", description = "Add a comment to a post")
    public ResponseEntity<CommentDto> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        request.setPostId(postId);
        return ResponseEntity.ok(commentService.createComment(currentUser.getId(), request));
    }
}

