package org.example.zaloapi.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.ConversationDto;
import org.example.zaloapi.dto.CreateConversationRequest;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.service.ConversationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conversations", description = "Conversation management APIs")
public class ConversationController {
    private final ConversationService conversationService;
    private final UserRepository userRepository;
    @PostMapping
    @Operation(summary = "Create conversation", description = "Create a new private or group conversation")
    public ResponseEntity<ConversationDto> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.createConversation(request, userId));
    }
    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation", description = "Get conversation details by ID")
    public ResponseEntity<ConversationDto> getConversation(@PathVariable Long conversationId) {
        return ResponseEntity.ok(conversationService.getConversationById(conversationId));
    }
    @GetMapping
    @Operation(summary = "Get user conversations", description = "Get all conversations for current user")
    public ResponseEntity<List<ConversationDto>> getUserConversations() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.getUserConversations(userId));
    }
    @PostMapping("/{conversationId}/read")
    @Operation(summary = "Mark conversation as read", description = "Mark all messages in conversation as read for current user")
    public ResponseEntity<?> markConversationAsRead(@PathVariable Long conversationId) {
        try {
            Long userId = getCurrentUserId();
            conversationService.markConversationAsRead(conversationId, userId);
            return ResponseEntity.ok(java.util.Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(java.util.Map.of("error", "Failed to mark conversation as read: " + e.getMessage()));
        }
    }
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}