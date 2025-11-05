package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.entity.BlockedUser;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.BlockedUserRepository;
import org.example.zaloapi.repository.FriendshipRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockedUserRepository blockedUserRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    @Transactional
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new RuntimeException("Cannot block yourself");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("Blocker not found"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new RuntimeException("User to block not found"));

        // Check if already blocked
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            throw new RuntimeException("User is already blocked");
        }

        // Remove friendship if exists
        friendshipRepository.findBetweenUsers(blockerId, blockedId).ifPresent(friendshipRepository::delete);

        // Create block record
        BlockedUser blockedUser = new BlockedUser();
        blockedUser.setBlocker(blocker);
        blockedUser.setBlocked(blocked);
        blockedUserRepository.save(blockedUser);
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        BlockedUser blockedUser = blockedUserRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .orElseThrow(() -> new RuntimeException("User is not blocked"));
        blockedUserRepository.delete(blockedUser);
    }

    @Transactional(readOnly = true)
    public List<Long> getBlockedUserIds(Long userId) {
        return blockedUserRepository.findBlockedUserIdsByBlockerId(userId);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(Long blockerId, Long blockedId) {
        return blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }
}

