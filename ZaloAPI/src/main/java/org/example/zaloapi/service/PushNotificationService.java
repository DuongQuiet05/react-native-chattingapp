package org.example.zaloapi.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.zaloapi.entity.Device;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.DeviceRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.util.*;
/**
 * Service để gửi push notifications qua Expo Push Notification API
 * Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
    /**
     * Gửi push notification cho một user qua Expo Push API
     */
    public void sendPushNotification(Long userId, String title, String body, Map<String, String> data) {
        try {
            List<Device> devices = deviceRepository.findByUserIdAndIsActiveTrue(userId);
            if (devices.isEmpty()) {
                log.warn("⚠️ No active devices found for user: {}", userId);
                return;
            }
            List<Map<String, Object>> messages = new ArrayList<>();
            for (Device device : devices) {
                Map<String, Object> message = new HashMap<>();
                message.put("to", device.getFcmToken()); // Expo Push Token
                message.put("sound", "default");
                message.put("title", title);
                message.put("body", body);
                message.put("data", data != null ? data : new HashMap<>());
                message.put("priority", "high");
                message.put("channelId", "default");
                messages.add(message);
            }
            if (!messages.isEmpty()) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
                HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(messages, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    EXPO_PUSH_API_URL,
                    request,
                    Map.class
                );
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("✅ Push notification sent successfully to user {}: {} messages", userId, messages.size());
                    log.debug("Response: {}", response.getBody());
                } else {
                    log.error("❌ Failed to send push notification: {}", response.getStatusCode());
                }
            }
        } catch (Exception e) {
            log.error("❌ Unexpected error sending push notification: ", e);
        }
    }
    /**
     * Gửi push notification khi có tin nhắn mới
     */
    public void sendNewMessageNotification(Long receiverId, String senderName, String messageContent, Long conversationId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "MESSAGE");
        data.put("conversationId", String.valueOf(conversationId));
        data.put("senderName", senderName);
        String title = "Tin nhắn mới";
        String body = senderName + ": " + (messageContent.length() > 50 ? messageContent.substring(0, 50) + "..." : messageContent);
        sendPushNotification(receiverId, title, body, data);
    }
    /**
     * Gửi push notification khi có yêu cầu kết bạn
     */
    public void sendFriendRequestNotification(Long receiverId, String senderName, Long requestId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "FRIEND_REQUEST");
        data.put("requestId", String.valueOf(requestId));
        data.put("senderName", senderName);
        String title = "Yêu cầu kết bạn mới";
        String body = senderName + " đã gửi lời mời kết bạn";
        sendPushNotification(receiverId, title, body, data);
    }
    /**
     * Gửi push notification khi yêu cầu kết bạn được chấp nhận
     */
    public void sendFriendAcceptedNotification(Long userId, String friendName) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "FRIEND_ACCEPTED");
        data.put("friendName", friendName);
        String title = "Đã chấp nhận kết bạn";
        String body = friendName + " đã chấp nhận lời mời kết bạn của bạn";
        sendPushNotification(userId, title, body, data);
    }
    /**
     * Đăng ký Expo Push token cho user
     */
    @Transactional
    public void registerDevice(Long userId, String expoPushToken, String deviceId, Device.DeviceType deviceType, String appVersion) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Optional<Device> existingDevice = deviceRepository.findByUserIdAndDeviceId(userId, deviceId);
        if (existingDevice.isPresent()) {
            Device device = existingDevice.get();
            device.setFcmToken(expoPushToken); // Lưu Expo Push Token
            device.setDeviceType(deviceType);
            device.setAppVersion(appVersion);
            device.setIsActive(true);
            deviceRepository.save(device);
            log.info("✅ Updated device token for user {}: {}", userId, deviceId);
        } else {
            Device device = new Device();
            device.setUser(user);
            device.setFcmToken(expoPushToken); // Lưu Expo Push Token
            device.setDeviceId(deviceId);
            device.setDeviceType(deviceType);
            device.setAppVersion(appVersion);
            device.setIsActive(true);
            deviceRepository.save(device);
            log.info("✅ Registered new device token for user {}: {}", userId, deviceId);
        }
    }
    /**
     * Hủy đăng ký device token
     */
    @Transactional
    public void unregisterDevice(Long userId, String deviceId) {
        deviceRepository.deleteByUserIdAndDeviceId(userId, deviceId);
        log.info("✅ Unregistered device for user {}: {}", userId, deviceId);
    }
    /**
     * Gửi push notification khi có comment trên bài viết
     */
    public void sendPostCommentNotification(Long receiverId, String commenterName, Long postId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "POST_COMMENT");
        data.put("postId", String.valueOf(postId));
        data.put("commenterName", commenterName);
        String title = "Bình luận mới";
        String body = commenterName + " đã bình luận bài viết của bạn";
        sendPushNotification(receiverId, title, body, data);
    }
    /**
     * Gửi push notification khi có reply comment
     */
    public void sendCommentReplyNotification(Long receiverId, String replierName, Long commentId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "COMMENT_REPLY");
        data.put("commentId", String.valueOf(commentId));
        data.put("replierName", replierName);
        String title = "Phản hồi bình luận";
        String body = replierName + " đã phản hồi bình luận của bạn";
        sendPushNotification(receiverId, title, body, data);
    }
    /**
     * Gửi push notification khi có reaction trên bài viết
     */
    public void sendPostReactionNotification(Long receiverId, String reactorName, String reactionText, Long postId) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "POST_REACTION");
        data.put("postId", String.valueOf(postId));
        data.put("reactorName", reactorName);
        data.put("reactionText", reactionText);
        String title = "Reaction mới";
        String body = reactorName + " đã " + reactionText + " bài viết của bạn";
        sendPushNotification(receiverId, title, body, data);
    }
}