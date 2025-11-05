package org.example.zaloapi.util;

import java.util.regex.Pattern;

/**
 * Utility class để xử lý số điện thoại Việt Nam
 */
public class PhoneNumberUtil {

    // Regex cho số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
    private static final Pattern VIETNAM_PHONE_PATTERN = Pattern.compile("^0\\d{9}$");

    // Regex cho số điện thoại quốc tế (+84...)
    private static final Pattern INTERNATIONAL_PHONE_PATTERN = Pattern.compile("^\\+84\\d{9}$");

    /**
     * Kiểm tra số điện thoại có hợp lệ không
     * Chấp nhận:
     * - 0339533380 (định dạng Việt Nam)
     * - +84339533380 (định dạng quốc tế)
     */
    public static boolean isValidVietnamesePhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }

        String phone = phoneNumber.trim();
        return VIETNAM_PHONE_PATTERN.matcher(phone).matches()
            || INTERNATIONAL_PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * Chuyển đổi số điện thoại Việt Nam sang định dạng quốc tế
     * 0339533380 -> +84339533380
     * +84339533380 -> +84339533380 (giữ nguyên)
     */
    public static String toInternationalFormat(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        String phone = phoneNumber.trim();

        // Nếu đã có định dạng quốc tế, giữ nguyên
        if (phone.startsWith("+84")) {
            return phone;
        }

        // Chuyển đổi từ 0339533380 -> +84339533380
        if (phone.startsWith("0") && phone.length() == 10) {
            return "+84" + phone.substring(1);
        }

        throw new IllegalArgumentException("Invalid Vietnamese phone number format: " + phoneNumber);
    }

    /**
     * Chuyển đổi số điện thoại quốc tế về định dạng Việt Nam
     * +84339533380 -> 0339533380
     * 0339533380 -> 0339533380 (giữ nguyên)
     */
    public static String toLocalFormat(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        String phone = phoneNumber.trim();

        // Nếu đã là định dạng Việt Nam, giữ nguyên
        if (phone.startsWith("0") && phone.length() == 10) {
            return phone;
        }

        // Chuyển đổi từ +84339533380 -> 0339533380
        if (phone.startsWith("+84") && phone.length() == 12) {
            return "0" + phone.substring(3);
        }

        throw new IllegalArgumentException("Invalid phone number format: " + phoneNumber);
    }

    /**
     * Chuẩn hóa số điện thoại - luôn lưu dưới dạng quốc tế trong database
     */
    public static String normalize(String phoneNumber) {
        return toInternationalFormat(phoneNumber);
    }
}

