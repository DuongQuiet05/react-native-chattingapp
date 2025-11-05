package org.example.zaloapi.repository;

import org.example.zaloapi.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    List<CallLog> findByConversationIdOrderByStartTimeDesc(Long conversationId);

    @Query("SELECT c FROM CallLog c WHERE c.caller.id = :userId OR c.id IN (SELECT cp.callLog.id FROM CallParticipant cp WHERE cp.user.id = :userId) ORDER BY c.startTime DESC")
    List<CallLog> findCallLogsByUserId(@Param("userId") Long userId);
}

