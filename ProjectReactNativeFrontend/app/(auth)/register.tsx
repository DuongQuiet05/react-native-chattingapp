import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { register } from "@/lib/api/auth";

const PRIMARY = "#2e8a8a";
const BG = "#f8f6f6";

type RegisterFormState = {
  username: string;
  displayName: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type RegisterField = keyof RegisterFormState;

type FieldErrors = Partial<Record<RegisterField, string>> & {
  general?: string;
};

// Inline Components
const BackButton = () => {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
    );
};

const AuthInput: React.FC<
  TextInputProps & { containerStyle?: object; errorText?: string }
> = ({ containerStyle, errorText, ...props }) => {
  return (
    <View style={containerStyle}>
      <TextInput
        {...props}
        style={[
          styles.input,
          props.style,
          errorText ? styles.inputErrorBorder : null,
        ]}
        placeholderTextColor="#9CA3AF"
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>({
    username: "",
    displayName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: RegisterField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (currentStep: number): boolean => {
      const errors: FieldErrors = {};
      let isValid = true;

      if (currentStep === 1) {
          if (!form.displayName.trim()) errors.displayName = "Vui lòng nhập tên hiển thị của bạn.";
      } else if (currentStep === 2) {
          if (!form.username.trim()) errors.username = "Tên đăng nhập là bắt buộc.";
          
          const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
          if (!form.phone.trim()) errors.phone = "Số điện thoại là bắt buộc.";
          else if (!phoneRegex.test(form.phone)) errors.phone = "Số điện thoại không đúng định dạng";
      } else if (currentStep === 3) {
          if (!form.password) errors.password = "Vui lòng thiết lập mật khẩu.";
          if (!form.confirmPassword) errors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
          else if (form.password !== form.confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp.";
      }

      if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          isValid = false;
      }
      return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
        if (step < TOTAL_STEPS) {
            setStep((s) => s + 1);
        } else {
            handleRegister();
        }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleRegister = async () => {
    setFieldErrors({}); 
    setIsSubmitting(true);

    try {
      await register({
        username: form.username,
        displayName: form.displayName || form.username,
        phoneNumber: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword, // API requires this
      });
      
      Alert.alert(
        'Thành công',
        'Tài khoản đã được tạo! Vui lòng đăng nhập để tiếp tục.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Đăng ký thất bại';
      
      // Simple mapping for common errors
      const newErrors: FieldErrors = {};
      const lowerMsg = errorMsg.toLowerCase();
      
      if (lowerMsg.includes('username')) newErrors.username = errorMsg;
      else if (lowerMsg.includes('phone')) newErrors.phone = errorMsg;
      else newErrors.general = errorMsg;

      setFieldErrors(newErrors);
      
      // Auto-navigate to error step
      if (newErrors.username) setStep(1);
      else if (newErrors.phone) setStep(2);
      
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <BackButton />
          </View>

          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/logo/app-logo.png")} // Using existing logo
              style={styles.logo}
            />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>
              Trở thành thành viên của Lumo và kết nối ngay.
            </Text>

            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                <View
                    style={[
                    styles.progressThumb,
                    { width: `${(step / TOTAL_STEPS) * 100}%` },
                    ]}
                />
                </View>
                <Text style={styles.progressLabel}>
                Bước {step} / {TOTAL_STEPS}
                </Text>
            </View>

            {fieldErrors.general ? (
                <Text style={styles.generalError}>{fieldErrors.general}</Text>
            ) : null}

            {step === 1 && (
                <>
                <AuthInput
                    placeholder="Tên hiển thị"
                    value={form.displayName}
                    onChangeText={(v) => handleChange("displayName", v)}
                    errorText={fieldErrors.displayName}
                />
                </>
            )}

            {step === 2 && (
                <>
                <AuthInput
                    placeholder="Tên đăng nhập"
                    value={form.username}
                    onChangeText={(v) => handleChange("username", v)}
                    errorText={fieldErrors.username}
                    autoCapitalize="none"
                />
                <AuthInput
                    placeholder="Số điện thoại"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(v) => handleChange("phone", v)}
                    errorText={fieldErrors.phone}
                />
                </>
            )}

            {step === 3 && (
                <>
                <AuthInput
                    placeholder="Mật khẩu"
                    secureTextEntry
                    value={form.password}
                    onChangeText={(v) => handleChange("password", v)}
                    errorText={fieldErrors.password}
                />
                <AuthInput
                    placeholder="Xác nhận mật khẩu"
                    secureTextEntry
                    value={form.confirmPassword}
                    onChangeText={(v) => handleChange("confirmPassword", v)}
                    errorText={fieldErrors.confirmPassword}
                />
                </>
            )}

            <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleNext}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.primaryButtonText}>
                        {step === TOTAL_STEPS ? "Đăng ký" : "Tiếp tục"}
                    </Text>
                )}
            </TouchableOpacity>

            {step > 1 && (
                <TouchableOpacity style={styles.secondaryTextButton} onPress={handlePrev}>
                <Text style={styles.secondaryTextButtonText}>
                    Quay lại bước trước
                </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.haveAccountText}>
                Đã có tài khoản?{" "}
                <Text style={styles.haveAccountHighlight}>Đăng nhập</Text>
                </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 8,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 260,
    resizeMode: "contain",
  },
  form: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressThumb: {
    height: 6,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    color: "#111827",
    fontSize: 15,
  },
  inputErrorBorder: {
    borderColor: "#DC2626",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#DC2626",
  },
  generalError: {
    marginBottom: 8,
    fontSize: 13,
    color: "#DC2626",
  },
  primaryButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryTextButton: {
    marginTop: 8,
    alignSelf: "center",
  },
  secondaryTextButtonText: {
    fontSize: 14,
    color: "#4B5563",
  },
  haveAccountText: {
    marginTop: 16,
    color: "#4B5563",
    textAlign: "center",
    fontSize: 14,
  },
  haveAccountHighlight: {
    color: PRIMARY,
    fontWeight: "600",
  },
});