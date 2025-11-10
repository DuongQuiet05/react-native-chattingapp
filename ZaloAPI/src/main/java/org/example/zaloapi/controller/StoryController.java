package org.example.zaloapi.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.CreateStoryRequest;
import org.example.zaloapi.dto.StoryDto;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.StoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Stories", description = "Story management APIs")
public class StoryController {
    private final StoryService storyService;
    @PostMapping
    @Operation(summary = "Create a new story")
    public ResponseEntity<StoryDto> createStory(
            @Valid @RequestBody CreateStoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        StoryDto story = storyService.createStory(currentUser.getId(), request);
        return ResponseEntity.ok(story);
    }
    @GetMapping
    @Operation(summary = "Get all stories for current user (friends and own)")
    public ResponseEntity<List<StoryDto>> getStories(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<StoryDto> stories = storyService.getStoriesForUser(currentUser.getId());
        return ResponseEntity.ok(stories);
    }
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get stories for a specific user")
    public ResponseEntity<List<StoryDto>> getUserStories(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<StoryDto> stories = storyService.getUserStories(userId, currentUser.getId());
        return ResponseEntity.ok(stories);
    }
    @GetMapping("/{storyId}")
    @Operation(summary = "Get a specific story")
    public ResponseEntity<StoryDto> getStory(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        StoryDto story = storyService.getStory(storyId, currentUser.getId());
        return ResponseEntity.ok(story);
    }
    @PostMapping("/{storyId}/view")
    @Operation(summary = "Mark a story as viewed")
    public ResponseEntity<Map<String, Object>> viewStory(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        storyService.viewStory(storyId, currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }
    @DeleteMapping("/{storyId}")
    @Operation(summary = "Delete a story")
    public ResponseEntity<Map<String, Object>> deleteStory(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        storyService.deleteStory(storyId, currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }
}

