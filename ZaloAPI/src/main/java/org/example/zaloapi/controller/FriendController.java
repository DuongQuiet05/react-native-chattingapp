package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.*;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.FriendService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@Tag(name = "Friend Management", description = "APIs for managing friends and friend requests")
public class FriendController {

    private final FriendService friendService;

    /**
     * Tìm kiếm người dùng
     */
    @GetMapping("/search")
    @Operation(summary = "Search users by phone, username or display name")
    public ResponseEntity<List<UserSearchDto>> searchUsers(
            @RequestParam String query,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<UserSearchDto> results = friendService.searchUsers(query, currentUser.getId());
        return ResponseEntity.ok(results);
    }

    /**
     * Gửi lời mời kết bạn
     */
    @PostMapping("/requests")
    @Operation(summary = "Send friend request")
    public ResponseEntity<FriendRequestDto> sendFriendRequest(
            @Valid @RequestBody SendFriendRequestDto request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        FriendRequestDto friendRequest = friendService.sendFriendRequest(currentUser.getId(), request);
        return ResponseEntity.ok(friendRequest);
    }

    /**
     * Lấy danh sách lời mời kết bạn đã nhận (pending)
     */
    @GetMapping("/requests/received")
    @Operation(summary = "Get received friend requests")
    public ResponseEntity<List<FriendRequestDto>> getReceivedFriendRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<FriendRequestDto> requests = friendService.getPendingFriendRequests(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    /**
     * Lấy danh sách lời mời kết bạn đã gửi (pending)
     */
    @GetMapping("/requests/sent")
    @Operation(summary = "Get sent friend requests")
    public ResponseEntity<List<FriendRequestDto>> getSentFriendRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<FriendRequestDto> requests = friendService.getSentFriendRequests(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    /**
     * Chấp nhận lời mời kết bạn
     */
    @PostMapping("/requests/{requestId}/accept")
    @Operation(summary = "Accept friend request")
    public ResponseEntity<Map<String, Object>> acceptFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        friendService.acceptFriendRequest(requestId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Friend request accepted"
        ));
    }

    /**
     * Từ chối lời mời kết bạn
     */
    @PostMapping("/requests/{requestId}/reject")
    @Operation(summary = "Reject friend request")
    public ResponseEntity<Map<String, Object>> rejectFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        friendService.rejectFriendRequest(requestId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Friend request rejected"
        ));
    }

    /**
     * Hủy lời mời kết bạn đã gửi
     */
    @DeleteMapping("/requests/{requestId}")
    @Operation(summary = "Cancel sent friend request")
    public ResponseEntity<Map<String, Object>> cancelFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        friendService.cancelFriendRequest(requestId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Friend request cancelled"
        ));
    }

    /**
     * Lấy danh sách bạn bè
     */
    @GetMapping
    @Operation(summary = "Get friends list")
    public ResponseEntity<List<UserBasicDto>> getFriends(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<UserBasicDto> friends = friendService.getFriends(currentUser.getId());
        return ResponseEntity.ok(friends);
    }

    /**
     * Xóa bạn bè
     */
    @DeleteMapping("/{friendId}")
    @Operation(summary = "Remove friend")
    public ResponseEntity<Map<String, Object>> removeFriend(
            @PathVariable Long friendId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        friendService.removeFriend(currentUser.getId(), friendId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Friend removed"
        ));
    }

    /**
     * Đếm số lời mời đang chờ
     */
    @GetMapping("/requests/count")
    @Operation(summary = "Count pending friend requests")
    public ResponseEntity<Map<String, Object>> countPendingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        long count = friendService.countPendingRequests(currentUser.getId());
        return ResponseEntity.ok(Map.of(
            "count", count
        ));
    }
}

