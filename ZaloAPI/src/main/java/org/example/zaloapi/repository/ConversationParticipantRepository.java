package org.example.zaloapi.repository;

import org.example.zaloapi.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {
    List<ConversationParticipant> findByConversationId(Long conversationId);
    Optional<ConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
}

