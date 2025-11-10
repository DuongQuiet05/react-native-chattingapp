package org.example.zaloapi.repository;
import org.example.zaloapi.entity.CallParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface CallParticipantRepository extends JpaRepository<CallParticipant, Long> {
    List<CallParticipant> findByCallLogId(Long callLogId);
}