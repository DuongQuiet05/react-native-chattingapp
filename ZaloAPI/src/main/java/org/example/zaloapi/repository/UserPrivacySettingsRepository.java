package org.example.zaloapi.repository;

import org.example.zaloapi.entity.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPrivacySettingsRepository extends JpaRepository<UserPrivacySettings, Long> {

    Optional<UserPrivacySettings> findByUserId(Long userId);
}

