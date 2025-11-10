package org.example.zaloapi.dto;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 100)
    private String displayName;
    private String avatarUrl;
    @Size(max = 500)
    private String bio;
    private String dateOfBirth;
    private String gender;
}