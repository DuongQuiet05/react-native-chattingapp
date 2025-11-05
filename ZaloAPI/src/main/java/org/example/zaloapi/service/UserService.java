package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.UpdateProfileRequest;
import org.example.zaloapi.dto.UserDto;
import org.example.zaloapi.dto.UserProfileDto;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, User.UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(status);
        if (status == User.UserStatus.OFFLINE) {
            user.setLastSeen(LocalDateTime.now());
        }

        user = userRepository.save(user);
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateProfile(Long userId, String displayName, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (displayName != null) {
            user.setDisplayName(displayName);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        user = userRepository.save(user);
        return convertToDto(user);
    }

    @Transactional
    public UserProfileDto updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        user = userRepository.save(user);
        return convertToProfileDto(user);
    }

    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToProfileDto(user);
    }

    private UserDto convertToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getStatus().name(),
                user.getLastSeen()
        );
    }

    private UserProfileDto convertToProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .status(user.getStatus().name())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

