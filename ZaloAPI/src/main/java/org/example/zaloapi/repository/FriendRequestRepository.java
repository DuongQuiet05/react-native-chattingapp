package org.example.zaloapi.repository;
import org.example.zaloapi.entity.FriendRequest;
import org.example.zaloapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    /**
     * Tìm lời mời kết bạn giữa 2 người dùng (bất kể ai là sender/receiver)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "(fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR " +
           "(fr.sender.id = :userId2 AND fr.receiver.id = :userId1)")
    Optional<FriendRequest> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    /**
     * Tìm lời mời đang chờ giữa 2 người dùng
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "fr.status = 'PENDING' AND " +
           "((fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR " +
           "(fr.sender.id = :userId2 AND fr.receiver.id = :userId1))")
    Optional<FriendRequest> findPendingBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    /**
     * Lấy danh sách lời mời đã gửi của user
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.sender.id = :senderId AND fr.status = :status")
    List<FriendRequest> findBySenderAndStatus(@Param("senderId") Long senderId, @Param("status") FriendRequest.RequestStatus status);
    /**
     * Lấy danh sách lời mời nhận được của user
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.receiver.id = :receiverId AND fr.status = :status")
    List<FriendRequest> findByReceiverAndStatus(@Param("receiverId") Long receiverId, @Param("status") FriendRequest.RequestStatus status);
    /**
     * Đếm số lời mời đang chờ của user
     */
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE fr.receiver.id = :userId AND fr.status = 'PENDING'")
    long countPendingRequestsByReceiver(@Param("userId") Long userId);
    /**
     * Kiểm tra xem có lời mời đang chờ từ sender đến receiver không
     */
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, FriendRequest.RequestStatus status);
}