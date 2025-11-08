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

    /**
     * Tìm conversation PRIVATE giữa 2 người dùng
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN ConversationParticipant cp1 ON c.id = cp1.conversation.id " +
           "JOIN ConversationParticipant cp2 ON c.id = cp2.conversation.id " +
           "WHERE c.type = 'PRIVATE' " +
           "AND cp1.user.id = :userId1 AND cp2.user.id = :userId2 " +
           "AND cp1.user.id != cp2.user.id " +
           "ORDER BY c.createdAt ASC")
    List<Conversation> findPrivateConversationsBetweenUsers(
            @Param("userId1") Long userId1, 
            @Param("userId2") Long userId2
    );
}

