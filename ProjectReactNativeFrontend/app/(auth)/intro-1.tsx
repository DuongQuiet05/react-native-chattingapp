import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slide, slides } from "@/constants/slides";
// import SplashScreen from "./splash"; // Removed as file does not exist

const { width } = Dimensions.get("window");

export default function IntroScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNavigation = (route: string) => {
    // Mark intro as seen usually happens here or in index
    // For now just navigate
    router.push(route as Href);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={[styles.illustration, { backgroundColor: item.color }]}>
        <Text style={styles.illustrationText}>{item.title}</Text>
      </View>

      <Text style={styles.slideDesc}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <SplashScreen></SplashScreen> */}
      {/* Top bar: logo */}
      <View style={styles.topBar}>
        <Image
          source={require("@/assets/logo/app-logo.png")}
          style={styles.logo}
        />
      </View>

      {/* Nội dung chính */}
      <View style={styles.content}>
        <FlatList
          data={slides}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={styles.sliderContent}
        />

        {/* Dots pagination */}
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Nút Đăng nhập / Tạo tài khoản mới */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleNavigation("/(auth)/login")}
        >
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleNavigation("/(auth)/register")}
        >
          <Text style={styles.secondaryButtonText}>Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f6f6",
  },

  topBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
    height: '30%', // Increased from 15%
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.8, // Increased from 0.6
    height: '100%',
    resizeMode: "contain",
  },

  content: {
    flex: 1, // Take available space
    justifyContent: 'center',
  },
  sliderContent: {
    // Remove large padding to let flex center it
    justifyContent: "center",
    alignItems: "center",
  },

  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  illustration: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    opacity: 0.9,
  },
  illustrationText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  slideDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 8,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#2e8a8a",
    width: 8,
    height: 8,
  },

  bottomButtons: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 24, // Add padding bottom
    // Remove absolute top
    marginTop: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: "#2e8a8a",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: "#eaeaeaff",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});