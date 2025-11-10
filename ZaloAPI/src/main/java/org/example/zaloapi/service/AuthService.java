package org.example.zaloapi.service;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.*;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.security.JwtUtil;
import org.example.zaloapi.util.PhoneNumberUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final FirebaseService firebaseService;
    /**
     * Đăng ký user mới - yêu cầu xác thực OTP trước
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        // Normalize phone number to international format (0339533380 -> +84339533380)
        String normalizedPhone = PhoneNumberUtil.normalize(request.getPhoneNumber());
        // Check if phone number already exists
        if (userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new RuntimeException("Phone number already registered");
        }
        // Create new user (phone not verified yet)
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPhoneNumber(normalizedPhone); // Lưu định dạng quốc tế
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername());
        user.setStatus(User.UserStatus.OFFLINE);
        user.setIsPhoneVerified(false); // Chưa xác thực
        user = userRepository.save(user);
        // Note: User cannot login until phone is verified
        return new AuthResponse(
                null, // Không trả về token vì chưa verify
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()
        );
    }
    /**
     * Gửi mã OTP đến số điện thoại
     * LƯU Ý: Firebase Authentication không hỗ trợ gửi SMS từ backend
     * Frontend phải tự gọi Firebase signInWithPhoneNumber()
     * Method này chỉ để validate và log
     */
    @Transactional
    public OtpResponse sendOtp(SendOtpRequest request) {
        try {
            // Normalize phone number
            String normalizedPhone = PhoneNumberUtil.normalize(request.getPhoneNumber());
            // Check if user exists with this phone number
            User user = userRepository.findByPhoneNumber(normalizedPhone)
                    .orElseThrow(() -> new RuntimeException("Phone number not registered. Please register first."));
            // Check if already verified
            if (user.getIsPhoneVerified()) {
                return new OtpResponse(false, "Phone number already verified", null);
            }
            return new OtpResponse(
                    true,
                    "Please use Firebase Authentication on frontend to send OTP. Backend cannot send SMS directly.",
                    normalizedPhone
            );
        } catch (Exception e) {
            return new OtpResponse(false, "Failed to process OTP request: " + e.getMessage(), null);
        }
    }
    /**
     * Xác thực OTP từ Firebase
     */
    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        try {
            // Verify Firebase ID Token
            FirebaseToken decodedToken = firebaseService.verifyIdToken(request.getIdToken());
            // Get phone number from token
            String phoneFromToken = firebaseService.getPhoneNumberFromToken(decodedToken);
            // Normalize both phone numbers for comparison
            String normalizedRequestPhone = PhoneNumberUtil.normalize(request.getPhoneNumber());
            String normalizedTokenPhone = PhoneNumberUtil.normalize(phoneFromToken);
            // Verify phone number matches
            if (!normalizedRequestPhone.equals(normalizedTokenPhone)) {
                return new OtpResponse(false, "Phone number mismatch", null);
            }
            User user = userRepository.findByPhoneNumber(normalizedRequestPhone)
                    .orElseThrow(() -> new RuntimeException("User not found with this phone number"));
            // Mark phone as verified
            user.setIsPhoneVerified(true);
            userRepository.save(user);
            return new OtpResponse(true, "Phone verified successfully", null);
        } catch (FirebaseAuthException e) {
            return new OtpResponse(false, "Invalid OTP or expired: " + e.getMessage(), null);
        } catch (Exception e) {
            return new OtpResponse(false, "Verification failed: " + e.getMessage(), null);
        }
    }
    /**
     * Đăng nhập - chỉ cho phép nếu đã xác thực số điện thoại
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Check if user is blocked
        if (user.getIsBlocked() != null && user.getIsBlocked()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với ADMIN để được hỗ trợ.");
        }
        // Check if phone is verified
        if (!user.getIsPhoneVerified()) {
            throw new RuntimeException("Phone number not verified. Please verify your phone number first.");
        }
        user.setStatus(User.UserStatus.ONLINE);
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()
        );
    }
}