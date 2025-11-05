package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.FileUploadResponse;
import org.example.zaloapi.dto.MessageDto;
import org.example.zaloapi.dto.MessageReactionDto;
import org.example.zaloapi.dto.ReactToMessageRequest;
import org.example.zaloapi.dto.SendMessageRequest;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.service.CloudinaryService;
import org.example.zaloapi.service.MessageReactionService;
import org.example.zaloapi.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Messages", description = "Message management APIs")
public class MessageController {

    private final MessageService messageService;
    private final MessageReactionService messageReactionService;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload/image")
    @Operation(summary = "Upload image", description = "Upload image to Cloudinary and get URL")
    public ResponseEntity<FileUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // Log để debug
            System.out.println("📤 Received image upload request:");
            System.out.println("   - File name: " + file.getOriginalFilename());
            System.out.println("   - File size: " + file.getSize());
            System.out.println("   - Content type: " + file.getContentType());
            System.out.println("   - Is empty: " + file.isEmpty());
            
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }
            
            Map<String, Object> uploadResult = cloudinaryService.uploadImage(file);

            FileUploadResponse response = new FileUploadResponse();
            response.setFileUrl((String) uploadResult.get("secure_url"));
            response.setFileName(file.getOriginalFilename());
            response.setFileSize(file.getSize());
            response.setFileType(file.getContentType());
            response.setPublicId((String) uploadResult.get("public_id"));
            response.setThumbnailUrl((String) uploadResult.get("secure_url"));
            
            System.out.println("✅ Image uploaded successfully: " + response.getFileUrl());

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("❌ Failed to upload image: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Unexpected error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    @PostMapping("/upload/video")
    @Operation(summary = "Upload video", description = "Upload video to Cloudinary and get URL")
    public ResponseEntity<FileUploadResponse> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> uploadResult = cloudinaryService.uploadVideo(file);

            FileUploadResponse response = new FileUploadResponse();
            response.setFileUrl((String) uploadResult.get("secure_url"));
            response.setFileName(file.getOriginalFilename());
            response.setFileSize(file.getSize());
            response.setFileType(file.getContentType());
            response.setPublicId((String) uploadResult.get("public_id"));

            // Generate thumbnail for video
            String publicId = (String) uploadResult.get("public_id");
            String thumbnailUrl = cloudinaryService.generateVideoThumbnail(publicId);
            response.setThumbnailUrl(thumbnailUrl);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload video: " + e.getMessage());
        }
    }

    @PostMapping("/upload/file")
    @Operation(summary = "Upload file", description = "Upload file (PDF, DOC, etc.) to Cloudinary and get URL")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> uploadResult = cloudinaryService.uploadFile(file);

            FileUploadResponse response = new FileUploadResponse();
            response.setFileUrl((String) uploadResult.get("secure_url"));
            response.setFileName(file.getOriginalFilename());
            response.setFileSize(file.getSize());
            response.setFileType(file.getContentType());
            response.setPublicId((String) uploadResult.get("public_id"));

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @PostMapping
    @Operation(summary = "Send message", description = "Send a message to a conversation")
    public ResponseEntity<MessageDto> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(messageService.sendMessage(request, userId));
    }

    @GetMapping("/conversation/{conversationId}")
    @Operation(summary = "Get messages", description = "Get messages from a conversation with pagination")
    public ResponseEntity<List<MessageDto>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getConversationMessages(conversationId, page, size));
    }

    @PutMapping("/{messageId}/delivered")
    @Operation(summary = "Mark as delivered", description = "Mark message as delivered")
    public ResponseEntity<Void> markAsDelivered(@PathVariable Long messageId) {
        Long userId = getCurrentUserId();
        messageService.markMessageAsDelivered(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{messageId}/read")
    @Operation(summary = "Mark as read", description = "Mark message as read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        Long userId = getCurrentUserId();
        messageService.markMessageAsRead(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{messageId}/reactions")
    @Operation(summary = "React to message", description = "Add or toggle reaction to a message")
    public ResponseEntity<Map<String, Object>> reactToMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody ReactToMessageRequest request) {
        Long userId = getCurrentUserId();
        MessageReactionDto reaction = messageReactionService.reactToMessage(messageId, userId, request.getReactionType());
        
        if (reaction == null) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reaction removed"
            ));
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reaction", reaction
        ));
    }

    @DeleteMapping("/{messageId}/reactions")
    @Operation(summary = "Remove reaction", description = "Remove reaction from a message")
    public ResponseEntity<Map<String, Object>> removeReaction(@PathVariable Long messageId) {
        Long userId = getCurrentUserId();
        messageReactionService.removeReaction(messageId, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reaction removed"
        ));
    }

    @GetMapping("/{messageId}/reactions")
    @Operation(summary = "Get message reactions", description = "Get all reactions for a message")
    public ResponseEntity<List<MessageReactionDto>> getMessageReactions(@PathVariable Long messageId) {
        return ResponseEntity.ok(messageReactionService.getMessageReactions(messageId));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}

