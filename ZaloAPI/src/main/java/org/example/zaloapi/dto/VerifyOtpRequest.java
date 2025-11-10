package org.example.zaloapi.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class VerifyOtpRequest {
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    @NotBlank(message = "OTP code is required")
    private String otpCode;
    @NotBlank(message = "Firebase ID token is required")
    private String idToken;
}