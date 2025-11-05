package org.example.zaloapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(0\\d{9}|\\+84\\d{9})$", message = "Invalid Vietnamese phone number. Use format: 0339533380 or +84339533380")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private String displayName;
}

