package org.example.zaloapi.repository;

import org.example.zaloapi.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.author.id = :userId OR p.privacyType = 'PUBLIC' ORDER BY p.createdAt DESC")
    Page<Post> findVisiblePostsForUser(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.author.id IN :friendIds ORDER BY p.createdAt DESC")
    Page<Post> findPostsByFriends(@Param("friendIds") List<Long> friendIds, Pageable pageable);
    
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}

