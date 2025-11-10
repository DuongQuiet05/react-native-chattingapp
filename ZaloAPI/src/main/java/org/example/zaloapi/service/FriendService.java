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
    private final BlockService blockService;
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
        if (PhoneNumberUtil.isValidVietnamesePhone(query)) {
            String normalizedPhone = PhoneNumberUtil.normalize(query);
            Optional<User> userByPhone = userRepository.findByPhoneNumber(normalizedPhone);
            if (userByPhone.isPresent()) {
                User user = userByPhone.get();
                UserPrivacySettings privacy = getOrCreatePrivacySettings(user.getId());
                if (privacy.getAllowFindByPhone()) {
                    results.add(user);
                }
            }
        }
        if (results.isEmpty()) {
            Optional<User> userByUsername = userRepository.findByUsername(query);
            if (userByUsername.isPresent() && !userByUsername.get().getId().equals(currentUserId)) {
                results.add(userByUsername.get());
            }
        }
        if (results.isEmpty()) {
            List<User> usersByDisplayName = userRepository.findByDisplayNameContainingIgnoreCase(query);
            results.addAll(usersByDisplayName.stream()
                    .filter(u -> !u.getId().equals(currentUserId))
                    .limit(20)
                    .toList());
        }
        // Filter out blocked users (both ways)
        List<User> filteredResults = results.stream()
                .filter(user -> !blockService.isBlockedEitherWay(currentUserId, user.getId()))
                .collect(Collectors.toList());
        return filteredResults.stream()
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
        if (senderId.equals(request.getReceiverId())) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }
        if (friendshipRepository.findBetweenUsers(senderId, request.getReceiverId()).isPresent()) {
            throw new RuntimeException("Already friends");
        }
        Optional<FriendRequest> existingRequest = friendRequestRepository.findPendingBetweenUsers(senderId, request.getReceiverId());
        if (existingRequest.isPresent()) {
            throw new RuntimeException("Friend request already exists");
        }
        UserPrivacySettings receiverPrivacy = getOrCreatePrivacySettings(request.getReceiverId());
        if (!receiverPrivacy.getAllowFriendRequestFromStrangers()) {
            long mutualFriends = friendshipRepository.countMutualFriends(senderId, request.getReceiverId());
            if (mutualFriends == 0) {
                throw new RuntimeException("This user only accepts friend requests from mutual friends");
            }
        }
        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(sender);
        friendRequest.setReceiver(receiver);
        friendRequest.setMessage(request.getMessage());
        friendRequest.setStatus(FriendRequest.RequestStatus.PENDING);
        FriendRequest saved = friendRequestRepository.save(friendRequest);
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
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to accept this request");
        }
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }
        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        friendRequestRepository.save(request);
        Friendship friendship = new Friendship();
        friendship.setUser1(request.getSender());
        friendship.setUser2(request.getReceiver());
        friendshipRepository.save(friendship);
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
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to reject this request");
        }
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }
        request.setStatus(FriendRequest.RequestStatus.REJECTED);
        friendRequestRepository.save(request);
    }
    /**
     * Hủy lời mời kết bạn đã gửi
     */
    @Transactional
    public void cancelFriendRequest(Long requestId, Long userId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));
        if (!request.getSender().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to cancel this request");
        }
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request is no longer pending");
        }
        friendRequestRepository.delete(request);
    }
    /**
     * Lấy danh sách bạn bè
     */
    @Transactional(readOnly = true)
    public List<UserBasicDto> getFriends(Long userId) {
        try {
            List<Long> friendIds = friendshipRepository.findFriendIdsByUserId(userId);
            if (friendIds == null || friendIds.isEmpty()) {
                return new ArrayList<>();
            }
            List<User> friends = userRepository.findAllById(friendIds);
            return friends.stream()
                    .filter(user -> user != null) // Filter out null users
                    .map(this::mapToUserBasicDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting friends for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    /**
     * Xóa bạn bè
     */
    @Transactional
    public void removeFriend(Long userId, Long friendId) {
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
    /**
     * Lấy relationship status giữa 2 user
     */
    @Transactional(readOnly = true)
    public UserSearchDto.RelationshipStatus getRelationshipStatus(Long userId, Long currentUserId) {
        return determineRelationshipStatus(userId, currentUserId);
    }
    /**
     * Đếm số bạn chung giữa 2 user
     */
    @Transactional(readOnly = true)
    public long countMutualFriends(Long userId1, Long userId2) {
        return friendshipRepository.countMutualFriends(userId1, userId2);
    }
    // ========== HELPER METHODS ==========
    private UserSearchDto mapToUserSearchDto(User user, Long currentUserId) {
        UserPrivacySettings privacy = getOrCreatePrivacySettings(user.getId());
        UserSearchDto.RelationshipStatus status = determineRelationshipStatus(user.getId(), currentUserId);
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
        if (friendshipRepository.findBetweenUsers(userId, currentUserId).isPresent()) {
            return UserSearchDto.RelationshipStatus.FRIEND;
        }
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserPrivacySettings settings = new UserPrivacySettings();
        settings.setUser(user);
        settings.setAllowFindByPhone(true);
        settings.setAllowFriendRequestFromStrangers(true);
        settings.setShowPhoneToFriends(false);
        return privacySettingsRepository.saveAndFlush(settings);
    }
}