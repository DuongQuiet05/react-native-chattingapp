import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const INTRO_SEEN_KEY = '@intro_seen';

export default function Intro2Screen() {
  const handleGetStarted = async () => {
    try {
      // Mark intro as seen
      await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
      router.push('/(auth)/login');
    } catch (error) {
      console.error('Error saving intro status:', error);
      router.push('/(auth)/login');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    // Handle social login logic here
    console.log(`Login with ${provider}`);
  };

  return (
    <LinearGradient
      colors={['#F0F8FF', '#F5F5F0']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Image Collage */}
          <View style={styles.imageCollage}>
            {/* Bottom-most image */}
            <View style={[styles.imageCard, styles.imageCard4]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="phone-portrait" size={40} color="#87CEEB" />
              </View>
            </View>
            
            {/* Right-middle image */}
            <View style={[styles.imageCard, styles.imageCard3]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="people" size={40} color="#87CEEB" />
              </View>
            </View>
            
            {/* Left-middle image */}
            <View style={[styles.imageCard, styles.imageCard2]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="happy" size={40} color="#87CEEB" />
              </View>
            </View>
            
            {/* Top-most image */}
            <View style={[styles.imageCard, styles.imageCard1]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="people-circle" size={40} color="#87CEEB" />
              </View>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <ThemedText style={styles.title}>Step Into Commuin</ThemedText>
            <ThemedText style={styles.subtitle}>
              Discover authentic relationships and real growth— one conversation at a time.
            </ThemedText>
          </View>

          {/* Social Login Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
            >
              <View style={styles.googleIconContainer}>
                <ThemedText style={styles.googleText}>G</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('facebook')}
            >
              <View style={[styles.socialIconContainer, styles.facebookIcon]}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-apple" size={24} color="#000000" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Call to Action Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <ThemedText style={styles.buttonText}>Let's Get Started</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Math.max(40, height * 0.05),
    paddingBottom: 20,
  },
  imageCollage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Math.min(200, height * 0.25),
    marginBottom: 24,
    minHeight: 180,
  },
  imageCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: width * 0.4,
    height: width * 0.4 * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCard1: {
    top: 0,
    zIndex: 4,
    transform: [{ rotate: '-3deg' }],
  },
  imageCard2: {
    left: width * 0.05,
    top: 25,
    zIndex: 3,
    transform: [{ rotate: '5deg' }],
  },
  imageCard3: {
    right: width * 0.05,
    top: 30,
    zIndex: 2,
    transform: [{ rotate: '-4deg' }],
  },
  imageCard4: {
    bottom: 0,
    zIndex: 1,
    transform: [{ rotate: '6deg' }],
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: Math.min(32, width * 0.08),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  socialIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookIcon: {
    backgroundColor: '#FFFFFF',
  },
  googleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
