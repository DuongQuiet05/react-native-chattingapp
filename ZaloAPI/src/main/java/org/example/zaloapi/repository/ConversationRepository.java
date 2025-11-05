package org.example.zaloapi.repository;

import org.example.zaloapi.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c JOIN ConversationParticipant cp ON c.id = cp.conversation.id WHERE cp.user.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);
}

