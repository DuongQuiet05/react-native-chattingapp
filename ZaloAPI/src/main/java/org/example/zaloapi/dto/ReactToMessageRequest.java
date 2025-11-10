package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactToMessageRequest {
    private String reactionType; // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
}