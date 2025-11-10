package org.example.zaloapi.repository;
import org.example.zaloapi.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByUserIdAndIsActiveTrue(Long userId);
    Optional<Device> findByUserIdAndDeviceId(Long userId, String deviceId);
    Optional<Device> findByFcmToken(String fcmToken);
    void deleteByUserIdAndDeviceId(Long userId, String deviceId);
}