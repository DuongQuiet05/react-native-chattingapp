package org.example.zaloapi.repository;

import org.example.zaloapi.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    List<MessageReaction> findByMessageId(Long messageId);
    Optional<MessageReaction> findByMessageIdAndUserIdAndReactionType(
            Long messageId, Long userId, MessageReaction.ReactionType reactionType);
    void deleteByMessageIdAndUserIdAndReactionType(
            Long messageId, Long userId, MessageReaction.ReactionType reactionType);
    long countByMessageIdAndReactionType(Long messageId, MessageReaction.ReactionType reactionType);
}

