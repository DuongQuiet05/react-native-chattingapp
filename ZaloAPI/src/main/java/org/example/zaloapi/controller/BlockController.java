package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Block Management", description = "APIs for blocking and unblocking users")
public class BlockController {

    private final BlockService blockService;

    @PostMapping("/{userId}")
    @Operation(summary = "Block user", description = "Block a user")
    public ResponseEntity<Map<String, Object>> blockUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        blockService.blockUser(currentUser.getId(), userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User blocked successfully"
        ));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Unblock user", description = "Unblock a user")
    public ResponseEntity<Map<String, Object>> unblockUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        blockService.unblockUser(currentUser.getId(), userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User unblocked successfully"
        ));
    }

    @GetMapping
    @Operation(summary = "Get blocked users", description = "Get list of blocked user IDs")
    public ResponseEntity<Map<String, Object>> getBlockedUsers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        return ResponseEntity.ok(Map.of(
                "blockedUserIds", blockService.getBlockedUserIds(currentUser.getId())
        ));
    }

    @GetMapping("/{userId}/check")
    @Operation(summary = "Check if user is blocked", description = "Check if a user is blocked")
    public ResponseEntity<Map<String, Object>> checkBlocked(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        return ResponseEntity.ok(Map.of(
                "isBlocked", blockService.isBlocked(currentUser.getId(), userId)
        ));
    }
}

