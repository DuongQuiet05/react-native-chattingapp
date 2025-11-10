package org.example.zaloapi.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.UpdateProfileRequest;
import org.example.zaloapi.dto.UserDto;
import org.example.zaloapi.dto.UserProfileDto;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User management APIs")
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get current authenticated user information")
    public ResponseEntity<UserDto> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }
    @GetMapping("/me/profile")
    @Operation(summary = "Get current user profile", description = "Get full profile information of current user")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }
    @PutMapping("/me/profile")
    @Operation(summary = "Update user profile", description = "Update full profile information")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        return ResponseEntity.ok(userService.updateUserProfile(userId, request));
    }
    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID", description = "Get user information by user ID")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }
    @GetMapping("/{userId}/profile")
    @Operation(summary = "Get user profile by ID", description = "Get full profile information by user ID")
    public ResponseEntity<UserProfileDto> getUserProfileById(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }
    @GetMapping
    @Operation(summary = "Get all users", description = "Get list of all users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    @PutMapping("/{userId}/status")
    @Operation(summary = "Update user status", description = "Update user online/offline/away status")
    public ResponseEntity<UserDto> updateStatus(
            @PathVariable Long userId,
            @RequestParam String status) {
        User.UserStatus userStatus = User.UserStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(userService.updateUserStatus(userId, userStatus));
    }
    @PutMapping("/{userId}/profile")
    @Operation(summary = "Update user profile", description = "Update user display name and avatar")
    public ResponseEntity<UserDto> updateProfile(
            @PathVariable Long userId,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String avatarUrl) {
        return ResponseEntity.ok(userService.updateProfile(userId, displayName, avatarUrl));
    }
}