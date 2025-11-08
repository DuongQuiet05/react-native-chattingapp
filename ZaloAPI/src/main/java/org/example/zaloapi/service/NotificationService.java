package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.NotificationDto;
import org.example.zaloapi.entity.Notification;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.NotificationRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    @Transactional
    public NotificationDto createNotification(Long userId, Notification.NotificationType type,
                                             String title, String content,
                                             Long relatedEntityId, String relatedEntityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setNotificationType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setIsRead(false);

        notification = notificationRepository.save(notification);
        NotificationDto notificationDto = convertToDto(notification);
        
        // Gửi notification realtime qua WebSocket
        try {
            notificationWebSocketService.sendNotificationToUser(userId, notificationDto);
        } catch (Exception e) {
            // Log nhưng không throw để không làm gián đoạn việc tạo notification
            System.err.println("⚠️ [NotificationService] Failed to send notification via WebSocket: " + e.getMessage());
        }
        
        return notificationDto;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        // Đếm các thông báo về: comment bài viết, reaction bài viết, reply comment
        // KHÔNG bao gồm MESSAGE, MESSAGE_REACTION (dùng cho badge ở chuông notification)
        return notificationRepository.countUnreadPostNotificationsByUserId(userId);
    }
    
    @Transactional(readOnly = true)
    public long getUnreadMessageNotificationCount(Long userId) {
        // Đếm các thông báo về: tin nhắn mới, reaction tin nhắn (dùng cho badge ở tab tin nhắn)
        return notificationRepository.countUnreadMessageNotificationsByUserId(userId);
    }
    
    @Transactional
    public void markMessageNotificationsAsReadByConversation(Long conversationId, Long userId) {
        // Mark MESSAGE và MESSAGE_REACTION notifications as read khi vào conversation
        notificationRepository.markMessageNotificationsAsReadByConversationId(userId, conversationId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only mark your own notifications as read");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .notificationType(notification.getNotificationType().name())
                .title(notification.getTitle())
                .content(notification.getContent())
                .relatedEntityId(notification.getRelatedEntityId())
                .relatedEntityType(notification.getRelatedEntityType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

