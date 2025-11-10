package org.example.zaloapi.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * DTO cho kết quả tìm kiếm user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDto {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber; // Chỉ hiển thị nếu user cho phép
    private Long mutualFriendsCount;
    private RelationshipStatus relationshipStatus;
    public enum RelationshipStatus {
        STRANGER,           // Người lạ
        FRIEND,             // Đã là bạn
        REQUEST_SENT,       // Đã gửi lời mời
        REQUEST_RECEIVED,   // Đã nhận lời mời
        BLOCKED             // Đã chặn (nếu có chức năng block)
    }
}