package org.example.zaloapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OtpResponse {
    private boolean success;
    private String message;
    private String sessionInfo; // For frontend to use with verification
}
