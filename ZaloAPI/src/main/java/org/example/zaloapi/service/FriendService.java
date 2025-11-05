package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.*;
import org.example.zaloapi.entity.*;
import org.example.zaloapi.repository.*;
import org.example.zaloapi.util.PhoneNumberUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final PushNotificationService pushNotificationService;
    private final NotificationService notificationService;

    /**
     * Tìm kiếm user theo số điện thoại, username hoặc display name
     */
    @Transactional
    public List<UserSearchDto> searchUsers(String query, Long currentUserId) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> results = new ArrayList<>();

        // 1. Tìm theo số điện thoại (ưu tiên cao nhất)
        if (PhoneNumberUtil.isValidVietnamesePhone(query)) {
            String normalizedPhone = PhoneNumberUtil.normalize(query);
            Optional<User> userByPhone = userRepository.findByPhoneNumber(normalizedPhone);

            if (userByPhone.isPresent()) {
                User user = userByPhone.get();
                // Kiểm tra privacy: user có cho phép tìm theo SĐT không?
                UserPrivacySettings privacy = getOrCreatePrivacySettings(user.getId());
                if (privacy.getAllowFindByPhone()) {
                    results.add(user);
                }
            }
        }

        // 2. Tìm theo username (chính xác)
        if (results.isEmpty()) {
            Optional<User> userByUsername = userRepository.findByUsername(query);
            if (userByUsername.isPresent() && !userByUsername.get().getId().equals(currentUserId)) {
                results.add(userByUsername.get());
            }
        }

        // 3. Tìm theo display name (gần đúng)
        if (results.isEmpty()) {
            List<User> usersByDisplayName = userRepository.findByDisplayNameContainingIgnoreCase(query);
            results.addAll(usersByDisplayName.stream()
                    .filter(u -> !u.getId().equals(currentUserId))
                    .limit(20)
                    .toList());
        }

        // Chuyển đổi sang DTO với relationship status
        return results.stream()
                .map(user -> mapToUserSearchDto(user, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Gửi lời mời kết bạn
     */
    @Transactional
    public FriendRequestDto sendFriendRequest(Long senderId, SendFriendRequestDto request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Kiểm tra không tự gửi cho chính mình
        if (senderId.equals(request.getReceiverId())) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }

        // Kiểm tra đã là bạn chưa
        if (friendshipRepository.findBetweenUsers(senderId, request.getReceiverId()).isPresent()) {
            throw new RuntimeException("Already friends");
        }

        // Kiểm tra đã có lời mời pending chưa
        Optional<FriendRequest> existingRequest = friendRequestRepository.findPendingBetweenUsers(senderId, request.getReceiverId());
        if (existingRequest.isPresent()) {
            throw new RuntimeException("Friend request already exists");
        }

        // Kiểm tra privacy của receiver
        UserPrivacySettings receiverPrivacy = getOrCreatePrivacySettings(request.getReceiverId());

        // Nếu receiver không cho phép nhận lời mời từ người lạ
        if (!receiverPrivacy.getAllowFriendRequestFromStrangers()) {
            // Kiểm tra có bạn chung không
            long mutualFriends = friendshipRepository.countMutualFriends(senderId, request.getReceiverId());
            if (mutualFriends == 0) {
                throw new RuntimeException("This user only accepts friend requests from mutual friends");
            }
        }

        // Tạo lời mời mới
        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(sender);
        friendRequest.setReceiver(receiver);
        friendRequest.setMessage(request.getMessage());
        friendRequest.setStatus(FriendRequest.RequestStatus.PENDING);

        FriendRequest saved = friendRequestRepository.save(friendRequest);

        // Tạo notification trong database
        try {
            notificationService.createNotification(
                request.getReceiverId(),
                Notification.NotificationType.FRIEND_REQUEST,
                "Yêu cầu kết bạn mới",
                sender.getDisplayName() + " đã gửi lời mời kết bạn",
                saved.getId(),
                "FRIEND_REQUEST"
            );
        } catch (Exception e) {
            System.err.println("⚠️ Failed to create notification: " + e.getMessage());
        }

        // Gửi push notification
        try {
            pushNotificationService.sendFriendRequestNotification(
                request.getReceiverId(),
                sender.getDisplayName(),
                saved.getId()
            );
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send push notification: " + e.getMessage());
        }

        return mapToFriendRequestDto(saved);
    }

    /**
     * Lấy danh sách lời mời kết bạn đang chờ xử lý
     */
    @Transactional(readOnly = true)
    public List<FriendRequestDto> getPendingFriendRequests(Long userId) {
        List<FriendRequest> requests = friendRequestRepository.findByReceiverAndStatus(
                userId, FriendRequest.RequestStatus.PENDING);

        return requests.stream()
                .map(this::mapToFriendRequestDto)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách lời mời đã gửi
     */
    @Transactional(readOnly = true)
    public List<FriendRequestDto> getSentFriendRequests(Long userId) {
        List<FriendRequest> requests = friendRequestRepository.findBySenderAndStatus(
                userId, FriendRequest.RequestStatus.PENDING);

        return requests.stream()
                .map(this::mapToFriendRequestDto)
                .collect(Collectors.toList());
    }

    /**
     * Chấp nhận lời mời kết bạn
     */
    @Transactional
    public void acceptFriendRequest(Long requestId, Long userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        // Kiểm tra user có phải receiver không
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to accept this request");
        }

        // Kiểm tra trạng thái
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }

        // Cập nhật trạng thái request
        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        // Tạo friendship (quan hệ 2 chiều)
        Friendship friendship = new Friendship();
        friendship.setUser1(request.getSender());
        friendship.setUser2(request.getReceiver());
        friendshipRepository.save(friendship);

        // Tạo notification cho sender khi được chấp nhận
        try {
            notificationService.createNotification(
                request.getSender().getId(),
                Notification.NotificationType.FRIEND_ACCEPTED,
                "Đã chấp nhận kết bạn",
                request.getReceiver().getDisplayName() + " đã chấp nhận lời mời kết bạn",
                request.getId(),
                "FRIEND_REQUEST"
            );
        } catch (Exception e) {
            System.err.println("⚠️ Failed to create notification: " + e.getMessage());
        }

        // Gửi push notification
        try {
            pushNotificationService.sendFriendAcceptedNotification(
                request.getSender().getId(),
                request.getReceiver().getDisplayName()
            );
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send push notification: " + e.getMessage());
        }
    }

    /**
     * Từ chối lời mời kết bạn
     */
    @Transactional
    public void rejectFriendRequest(Long requestId, Long userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        // Kiểm tra user có phải receiver không
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to reject this request");
        }

        // Kiểm tra trạng thái
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }

        // Cập nhật trạng thái
        request.setStatus(FriendRequest.RequestStatus.REJECTED);
        friendRequestRepository.save(request);

        // Không gửi notification cho sender
    }

    /**
     * Hủy lời mời kết bạn đã gửi
     */
    @Transactional
    public void cancelFriendRequest(Long requestId, Long userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        // Kiểm tra user có phải sender không
        if (!request.getSender().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to cancel this request");
        }

        // Kiểm tra trạng thái
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }

        // Xóa request
        friendRequestRepository.delete(request);
    }

    /**
     * Lấy danh sách bạn bè
     */
    @Transactional(readOnly = true)
    public List<UserBasicDto> getFriends(Long userId) {
        List<User> friends = friendshipRepository.findFriendsByUserId(userId);

        return friends.stream()
                .map(this::mapToUserBasicDto)
                .collect(Collectors.toList());
    }

    /**
     * Xóa bạn bè
     */
    @Transactional
    public void removeFriend(Long userId, Long friendId) {
        // Kiểm tra có phải bạn bè không
        Friendship friendship = friendshipRepository.findBetweenUsers(userId, friendId)
                .orElseThrow(() -> new RuntimeException("You are not friends with this user"));

        friendshipRepository.delete(friendship);
    }

    /**
     * Đếm số lời mời đang chờ
     */
    @Transactional(readOnly = true)
    public long countPendingRequests(Long userId) {
        return friendRequestRepository.countPendingRequestsByReceiver(userId);
    }

    // ========== HELPER METHODS ==========

    private UserSearchDto mapToUserSearchDto(User user, Long currentUserId) {
        UserPrivacySettings privacy = getOrCreatePrivacySettings(user.getId());

        // Kiểm tra relationship status
        UserSearchDto.RelationshipStatus status = determineRelationshipStatus(user.getId(), currentUserId);

        // Đếm bạn chung
        long mutualFriends = friendshipRepository.countMutualFriends(user.getId(), currentUserId);

        return UserSearchDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .phoneNumber(privacy.getShowPhoneToFriends() ? user.getPhoneNumber() : null)
                .mutualFriendsCount(mutualFriends)
                .relationshipStatus(status)
                .build();
    }

    private UserSearchDto.RelationshipStatus determineRelationshipStatus(Long userId, Long currentUserId) {
        // Kiểm tra đã là bạn
        if (friendshipRepository.findBetweenUsers(userId, currentUserId).isPresent()) {
            return UserSearchDto.RelationshipStatus.FRIEND;
        }

        // Kiểm tra có lời mời pending không
        Optional<FriendRequest> pendingRequest = friendRequestRepository.findPendingBetweenUsers(userId, currentUserId);
        if (pendingRequest.isPresent()) {
            FriendRequest request = pendingRequest.get();
            if (request.getSender().getId().equals(currentUserId)) {
                return UserSearchDto.RelationshipStatus.REQUEST_SENT;
            } else {
                return UserSearchDto.RelationshipStatus.REQUEST_RECEIVED;
            }
        }

        return UserSearchDto.RelationshipStatus.STRANGER;
    }

    private FriendRequestDto mapToFriendRequestDto(FriendRequest request) {
        return FriendRequestDto.builder()
                .id(request.getId())
                .sender(mapToUserBasicDto(request.getSender()))
                .receiver(mapToUserBasicDto(request.getReceiver()))
                .status(request.getStatus().name())
                .message(request.getMessage())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    private UserBasicDto mapToUserBasicDto(User user) {
        return UserBasicDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name())
                .build();
    }

    private UserPrivacySettings getOrCreatePrivacySettings(Long userId) {
        Optional<UserPrivacySettings> existing = privacySettingsRepository.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Tạo mới settings nếu chưa có
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPrivacySettings settings = new UserPrivacySettings();
        settings.setUser(user);
        // Không cần set userId vì @MapsId sẽ tự động lấy từ user
        settings.setAllowFindByPhone(true);
        settings.setAllowFriendRequestFromStrangers(true);
        settings.setShowPhoneToFriends(false);

        // Lưu và flush để đảm bảo được persist ngay
        return privacySettingsRepository.saveAndFlush(settings);
    }
}

