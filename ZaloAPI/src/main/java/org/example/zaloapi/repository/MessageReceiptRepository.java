package org.example.zaloapi.repository;
import org.example.zaloapi.entity.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, Long> {
    List<MessageReceipt> findByMessageId(Long messageId);
    Optional<MessageReceipt> findByMessageIdAndUserId(Long messageId, Long userId);
}