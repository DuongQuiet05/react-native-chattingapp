package org.example.zaloapi.repository;

import org.example.zaloapi.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    Optional<BlockedUser> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    List<BlockedUser> findByBlockerId(Long blockerId);
    List<BlockedUser> findByBlockedId(Long blockedId);
    
    @Query("SELECT bu.blocked.id FROM BlockedUser bu WHERE bu.blocker.id = :userId")
    List<Long> findBlockedUserIdsByBlockerId(@Param("userId") Long userId);
}

