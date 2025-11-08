package org.example.zaloapi.repository;

import org.example.zaloapi.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    
    // Đếm thông báo chưa đọc cho notification (chuông) - chỉ POST_COMMENT, POST_REACTION, COMMENT_REPLY
    @Query(value = "SELECT COUNT(n) FROM notifications n WHERE n.user_id = :userId AND n.is_read = false " +
           "AND n.notification_type IN ('POST_COMMENT', 'POST_REACTION', 'COMMENT_REPLY')", 
           nativeQuery = true)
    long countUnreadPostNotificationsByUserId(@Param("userId") Long userId);
    
    // Đếm thông báo chưa đọc cho tin nhắn - chỉ MESSAGE, MESSAGE_REACTION
    @Query(value = "SELECT COUNT(n) FROM notifications n WHERE n.user_id = :userId AND n.is_read = false " +
           "AND n.notification_type IN ('MESSAGE', 'MESSAGE_REACTION')", 
           nativeQuery = true)
    long countUnreadMessageNotificationsByUserId(@Param("userId") Long userId);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
    
    // Mark MESSAGE và MESSAGE_REACTION notifications as read cho conversation cụ thể
    // Sử dụng EXISTS để tương thích với MySQL
    @Modifying
    @Query(value = "UPDATE notifications n " +
           "SET n.is_read = true " +
           "WHERE n.user_id = :userId " +
           "AND n.is_read = false " +
           "AND n.notification_type IN ('MESSAGE', 'MESSAGE_REACTION') " +
           "AND EXISTS (SELECT 1 FROM messages m WHERE m.id = n.related_entity_id AND m.conversation_id = :conversationId)", 
           nativeQuery = true)
    void markMessageNotificationsAsReadByConversationId(@Param("userId") Long userId, @Param("conversationId") Long conversationId);
}

