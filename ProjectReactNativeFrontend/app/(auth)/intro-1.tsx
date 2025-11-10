import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');
export default function Intro1Screen() {
  const handleGetStarted = () => {
    router.push('/(auth)/intro-2');
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
          <View style={styles.imageCollage}>
            <View style={[styles.imageCard, styles.imageCard3]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={40} color="#87CEEB" />
              </View>
            </View>
            <View style={[styles.imageCard, styles.imageCard2]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="people" size={40} color="#87CEEB" />
              </View>
            </View>
            <View style={[styles.imageCard, styles.imageCard1]}>
              <View style={styles.placeholderImage}>
                <Ionicons name="camera" size={40} color="#87CEEB" />
              </View>
            </View>
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={styles.title}>Welcome to Commuin</ThemedText>
            <ThemedText style={styles.subtitle}>
              Connect, share, and grow with a vibrant community designed for meaningful social interactions.
            </ThemedText>
          </View>
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="chatbubbles" size={24} color="#4A90E2" />
              </View>
              <ThemedText style={styles.featureText}>
                Connect with real people, build bonds.
              </ThemedText>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up" size={24} color="#4A90E2" />
              </View>
              <ThemedText style={styles.featureText}>
                Explore trending topics, stay updated.
              </ThemedText>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="megaphone" size={24} color="#4A90E2" />
              </View>
              <ThemedText style={styles.featureText}>
                Share your voice, express yourself freely.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
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
    width: width * 0.45,
    height: width * 0.45 * 0.75,
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
    left: width * 0.08,
    top: 15,
    zIndex: 3,
    transform: [{ rotate: '-5deg' }],
  },
  imageCard2: {
    right: width * 0.08,
    top: 0,
    zIndex: 2,
    transform: [{ rotate: '3deg' }],
  },
  imageCard3: {
    left: width * 0.12,
    top: 40,
    zIndex: 1,
    transform: [{ rotate: '8deg' }],
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
    marginBottom: 24,
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
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
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