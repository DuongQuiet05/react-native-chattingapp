package org.example.zaloapi.repository;
import org.example.zaloapi.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);
    List<Message> findTop50ByConversationIdOrderBySentAtDesc(Long conversationId);
    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);
}