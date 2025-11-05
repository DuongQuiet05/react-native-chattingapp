package org.example.zaloapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.RegisterDeviceRequest;
import org.example.zaloapi.entity.Device;
import org.example.zaloapi.security.UserPrincipal;
import org.example.zaloapi.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Devices", description = "Device registration for push notifications")
public class DeviceController {

    private final PushNotificationService pushNotificationService;

    @PostMapping("/register")
    @Operation(summary = "Register device", description = "Register FCM token for push notifications")
    public ResponseEntity<Map<String, Object>> registerDevice(
            @Valid @RequestBody RegisterDeviceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Device.DeviceType deviceType = Device.DeviceType.valueOf(request.getDeviceType().toUpperCase());
            pushNotificationService.registerDevice(
                currentUser.getId(),
                request.getFcmToken(), // Thực ra là Expo Push Token
                request.getDeviceId(),
                deviceType,
                request.getAppVersion()
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Device registered successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid device type"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to register device: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/unregister")
    @Operation(summary = "Unregister device", description = "Remove device token")
    public ResponseEntity<Map<String, Object>> unregisterDevice(
            @RequestParam String deviceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            pushNotificationService.unregisterDevice(currentUser.getId(), deviceId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Device unregistered successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to unregister device: " + e.getMessage()
            ));
        }
    }
}

