package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDeviceRequest {
    private String fcmToken;
    private String deviceId;
    private String deviceType; // ANDROID, IOS, WEB
    private String appVersion;
}