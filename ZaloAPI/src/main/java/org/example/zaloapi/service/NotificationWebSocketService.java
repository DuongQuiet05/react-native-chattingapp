package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.NotificationDto;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service để gửi thông báo realtime qua WebSocket
 */
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Gửi thông báo đến user cụ thể qua WebSocket
     * Sử dụng /user/{username}/queue/notifications để gửi đến user đã đăng nhập
     * 
     * @param userId ID của user nhận thông báo
     * @param notification Thông báo cần gửi
     */
    public void sendNotificationToUser(Long userId, NotificationDto notification) {
        try {
            // Lấy username từ userId để route đến đúng WebSocket session
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                System.err.println("❌ [NotificationWebSocket] User not found: " + userId);
                return;
            }
            
            String username = user.getUsername();
            System.out.println("📤 [NotificationWebSocket] Sending notification to user " + username + " (ID: " + userId + "): " + notification.getId());
            
            // Gửi đến queue riêng của user (Spring sẽ tự động route đến đúng user session)
            // Format: /user/{username}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                    username, // Spring WebSocket sử dụng username từ Principal để route
                    "/queue/notifications",
                    notification
            );
            
            System.out.println("✅ [NotificationWebSocket] Notification sent successfully to user " + username);
        } catch (Exception e) {
            System.err.println("❌ [NotificationWebSocket] Failed to send notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

