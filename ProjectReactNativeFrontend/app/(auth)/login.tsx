import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";

const PRIMARY = "#2e8a8a";
const BG = "#f8f6f6";

type FieldErrors = {
  email?: string; 
  password?: string;
  general?: string;
};

type AuthInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  errorText?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

const AuthInput: React.FC<AuthInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  errorText,
  autoCapitalize = "none",
}) => {
  return (
    <View>
      <TextInput
        style={[styles.input, errorText ? styles.inputErrorBorder : null]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

// Inline BackButton component
const BackButton = () => {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
    );
};

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const router = useRouter();

  const { signIn } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const handleLogin = async () => {
    setFieldErrors({}); // clear old errors
    
    if (!identifier.trim() || !password) {
        setFieldErrors({ general: 'Vui lòng nhập đầy đủ thông tin đăng nhập.' });
        return;
    }

    setIsPending(true);

    try {
      await signIn({ username: identifier.trim(), password });
      // Redirect handled by logic or router replace if not auto-handled
       router.replace("/(tabs)/feed");
    } catch (error: any) {
      let errorMessage = '';
      let errorDetails: any = null;
      
      // Preserve existing error extraction logic
      if (error?.details) {
        errorDetails = error.details;
        if (typeof errorDetails === 'string') {
          try {
            errorDetails = JSON.parse(errorDetails);
          } catch {
            // Not JSON
          }
        }
        if (errorDetails?.message) {
          errorMessage = errorDetails.message;
        } else if (errorDetails?.error) {
          errorMessage = errorDetails.error;
        }
      }
      if (!errorMessage && error?.message) {
        errorMessage = error.message;
      }

      // Check specific error patterns
      const blockedPatterns = ['bị chặn', 'bị khóa', 'blocked', 'khóa', 'chặn', 'đã bị'];
      const isBlocked = blockedPatterns.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isBlocked) {
          setFieldErrors({ general: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
          return;
      }
      
      if (errorMessage.includes('not verified') || errorMessage.includes('chưa xác thực')) {
          setFieldErrors({ general: 'Tài khoản chưa được xác thực.' });
          return;
      }

      let displayMessage = 'Đăng nhập thất bại';
      if (error?.status === 401) {
        displayMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác';
      } else if (error?.status === 0) {
        displayMessage = 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.';
      } else if (errorMessage && !errorMessage.match(/^\d{3}\s/)) {
        displayMessage = errorMessage;
      }

      setFieldErrors({ general: displayMessage });
    } finally {
        setIsPending(false);
    }
  };

  const handleCreateAccount = () => {
    router.replace("/(auth)/register");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <BackButton />
          </View>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/logo/app-logo.png")} // Using existing logo
              style={styles.logo}
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để kết nối với bạn bè trên Lumo.
            </Text>

            {fieldErrors.general ? (
              <Text style={styles.generalError}>{fieldErrors.general}</Text>
            ) : null}

            <AuthInput
              placeholder="Tên đăng nhập"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              errorText={fieldErrors.email}
            />

            <AuthInput
              placeholder="Mật khẩu"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFieldErrors((prev) => ({
                  ...prev,
                  password: undefined,
                }));
              }}
              secureTextEntry
              errorText={fieldErrors.password}
            />

            <TouchableOpacity
              style={[styles.loginButton, isPending && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={isPending}
            >
               {isPending ? (
                   <ActivityIndicator color="#fff" />
               ) : (
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
               )}
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.createButtonText}>Tạo tài khoản</Text>
            </TouchableOpacity>

            <Text style={styles.footerBrand}>© Lumo</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: "space-between",
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
  loginButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotText: {
    marginTop: 10,
    alignSelf: "center",
    color: "#4B5563",
    fontSize: 14,
  },
  bottomArea: {
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  createButton: {
    height: 46,
    borderRadius: 999,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  footerBrand: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
});