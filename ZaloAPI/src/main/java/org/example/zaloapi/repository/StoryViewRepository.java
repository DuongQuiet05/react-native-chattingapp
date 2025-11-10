package org.example.zaloapi.repository;
import org.example.zaloapi.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    Optional<StoryView> findByStoryIdAndUserId(Long storyId, Long userId);
    List<StoryView> findByStoryIdOrderByViewedAtDesc(Long storyId);
    @Query("SELECT COUNT(sv) FROM StoryView sv WHERE sv.story.id = :storyId")
    Long countByStoryId(@Param("storyId") Long storyId);
    boolean existsByStoryIdAndUserId(Long storyId, Long userId);
}

