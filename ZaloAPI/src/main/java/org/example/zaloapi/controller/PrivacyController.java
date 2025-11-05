package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.entity.UserPrivacySettings;
import org.example.zaloapi.repository.UserPrivacySettingsRepository;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/privacy")
@RequiredArgsConstructor
@Tag(name = "Privacy Settings", description = "APIs for managing user privacy settings")
public class PrivacyController {

    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final UserRepository userRepository;

    /**
     * Lấy cài đặt quyền riêng tư hiện tại
     */
    @GetMapping
    @Operation(summary = "Get current privacy settings")
    public ResponseEntity<UserPrivacySettings> getPrivacySettings(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UserPrivacySettings settings = privacySettingsRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> createDefaultSettings(currentUser.getId()));

        return ResponseEntity.ok(settings);
    }

    /**
     * Cập nhật cài đặt quyền riêng tư
     */
    @PutMapping
    @Operation(summary = "Update privacy settings")
    public ResponseEntity<UserPrivacySettings> updatePrivacySettings(
            @RequestBody Map<String, Boolean> settings,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UserPrivacySettings privacySettings = privacySettingsRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> createDefaultSettings(currentUser.getId()));

        if (settings.containsKey("allowFindByPhone")) {
            privacySettings.setAllowFindByPhone(settings.get("allowFindByPhone"));
        }
        if (settings.containsKey("allowFriendRequestFromStrangers")) {
            privacySettings.setAllowFriendRequestFromStrangers(settings.get("allowFriendRequestFromStrangers"));
        }
        if (settings.containsKey("showPhoneToFriends")) {
            privacySettings.setShowPhoneToFriends(settings.get("showPhoneToFriends"));
        }

        UserPrivacySettings saved = privacySettingsRepository.save(privacySettings);
        return ResponseEntity.ok(saved);
    }

    private UserPrivacySettings createDefaultSettings(Long userId) {
        UserPrivacySettings settings = new UserPrivacySettings();
        settings.setUserId(userId);
        settings.setUser(userRepository.findById(userId).orElseThrow());
        settings.setAllowFindByPhone(true);
        settings.setAllowFriendRequestFromStrangers(true);
        settings.setShowPhoneToFriends(false);
        return privacySettingsRepository.save(settings);
    }
}

