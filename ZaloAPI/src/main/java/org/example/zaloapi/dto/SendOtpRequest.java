package org.example.zaloapi.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
@Data
public class SendOtpRequest {
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(0\\d{9}|\\+84\\d{9})$", message = "Invalid Vietnamese phone number. Use format: 0339533380 or +84339533380")
    private String phoneNumber;
}