package org.example.zaloapi.repository;
import org.example.zaloapi.entity.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {
    List<PostReaction> findByPostId(Long postId);
    Optional<PostReaction> findByPostIdAndUserIdAndReactionType(
            Long postId, Long userId, PostReaction.ReactionType reactionType);
    void deleteByPostIdAndUserIdAndReactionType(
            Long postId, Long userId, PostReaction.ReactionType reactionType);
    long countByPostIdAndReactionType(Long postId, PostReaction.ReactionType reactionType);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
}