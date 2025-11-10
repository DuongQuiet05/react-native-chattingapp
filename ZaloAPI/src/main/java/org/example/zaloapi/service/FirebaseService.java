package org.example.zaloapi.service;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
@Service
@Slf4j
public class FirebaseService {
    /**
     * Xác thực Firebase ID Token từ client
     * Client sẽ gửi OTP code lên Firebase và nhận về ID Token
     * Backend verify ID Token này để xác nhận user đã xác thực OTP thành công
     */
    public FirebaseToken verifyIdToken(String idToken) throws FirebaseAuthException {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            log.info("✅ Firebase token verified for UID: {}", decodedToken.getUid());
            return decodedToken;
        } catch (FirebaseAuthException e) {
            log.error("❌ Failed to verify Firebase token: {}", e.getMessage());
            throw e;
        }
    }
    /**
     * Lấy số điện thoại từ Firebase token
     */
    public String getPhoneNumberFromToken(FirebaseToken token) {
        Object phoneNumber = token.getClaims().get("phone_number");
        if (phoneNumber == null) {
            log.warn("⚠️ Phone number not found in Firebase token");
            return null;
        }
        return phoneNumber.toString();
    }
    /**
     * Kiểm tra xem Firebase đã được cấu hình chưa
     */
    public boolean isFirebaseConfigured() {
        try {
            FirebaseAuth.getInstance();
            return true;
        } catch (Exception e) {
            log.warn("⚠️ Firebase is not configured");
            return false;
        }
    }
}