package org.example.zaloapi.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.config.path:firebase-service-account.json}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initialize() {
        try {
            // Kiểm tra nếu FirebaseApp đã được khởi tạo
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = new ClassPathResource(firebaseConfigPath).getInputStream();

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase Admin SDK initialized successfully");
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to initialize Firebase Admin SDK: " + e.getMessage());
            System.err.println("⚠️ OTP verification will not work without Firebase configuration");
            // Không throw exception để app vẫn có thể chạy mà không có Firebase
        }
    }
}

