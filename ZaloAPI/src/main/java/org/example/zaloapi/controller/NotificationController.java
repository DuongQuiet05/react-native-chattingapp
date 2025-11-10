package org.example.zaloapi.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.NotificationDto;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {
    private final NotificationService notificationService;
    @GetMapping
    @Operation(summary = "Get notifications", description = "Get paginated notifications for current user")
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.getId(), page, size));
    }
    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Get all unread notifications")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(Map.of(
                "notifications", notificationService.getUnreadNotifications(currentUser.getId())
        ));
    }
    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Get count of unread post notifications (POST_COMMENT, POST_REACTION, COMMENT_REPLY)")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(Map.of(
                "count", notificationService.getUnreadCount(currentUser.getId())
        ));
    }
    @GetMapping("/unread/message/count")
    @Operation(summary = "Get unread message notification count", description = "Get count of unread message notifications (MESSAGE, MESSAGE_REACTION)")
    public ResponseEntity<Map<String, Object>> getUnreadMessageNotificationCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(Map.of(
                "count", notificationService.getUnreadMessageNotificationCount(currentUser.getId())
        ));
    }
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.markAsRead(notificationId, currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notification marked as read"
        ));
    }
    @PutMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all notifications as read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All notifications marked as read"
        ));
    }
}