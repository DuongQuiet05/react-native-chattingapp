package org.example.zaloapi.repository;

import org.example.zaloapi.entity.Friendship;
import org.example.zaloapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Kiểm tra 2 user có phải bạn bè không
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.user1.id = :userId1 AND f.user2.id = :userId2) OR " +
           "(f.user1.id = :userId2 AND f.user2.id = :userId1)")
    Optional<Friendship> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Lấy danh sách bạn bè của user
     */
    @Query("SELECT CASE WHEN f.user1.id = :userId THEN f.user2 ELSE f.user1 END " +
           "FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
    List<User> findFriendsByUserId(@Param("userId") Long userId);

    /**
     * Lấy danh sách ID bạn bè của user (để check nhanh)
     */
    @Query("SELECT CASE WHEN f.user1.id = :userId THEN f.user2.id ELSE f.user1.id END " +
           "FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
    List<Long> findFriendIdsByUserId(@Param("userId") Long userId);

    /**
     * Đếm số bạn bè
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
    long countFriendsByUserId(@Param("userId") Long userId);

    /**
     * Đếm số bạn chung giữa 2 user
     */
    @Query("SELECT COUNT(DISTINCT CASE WHEN f1.user1.id = :userId1 THEN f1.user2.id ELSE f1.user1.id END) " +
           "FROM Friendship f1, Friendship f2 WHERE " +
           "(f1.user1.id = :userId1 OR f1.user2.id = :userId1) AND " +
           "(f2.user1.id = :userId2 OR f2.user2.id = :userId2) AND " +
           "CASE WHEN f1.user1.id = :userId1 THEN f1.user2.id ELSE f1.user1.id END = " +
           "CASE WHEN f2.user1.id = :userId2 THEN f2.user2.id ELSE f2.user1.id END")
    long countMutualFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Xóa friendship giữa 2 user
     */
    @Query("DELETE FROM Friendship f WHERE " +
           "(f.user1.id = :userId1 AND f.user2.id = :userId2) OR " +
           "(f.user1.id = :userId2 AND f.user2.id = :userId1)")
    void deleteBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}

