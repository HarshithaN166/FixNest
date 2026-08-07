import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Entrance animation (Fade in & scale up)
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    glowOpacity.value = withTiming(0.6, { duration: 1000 });

    // 2. Hold for 1.2 seconds, then exit & finish
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished && onFinish) {
          runOnJS(onFinish)();
        }
      });
      // Web safety fallback to ensure transition occurs
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background radial glow effect */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/FixNest.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View style={[styles.brandContainer, logoAnimatedStyle]}>
          <Text style={styles.brandTitle}>FixNest</Text>
          <Text style={styles.brandSubtitle}>AI Household Services</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: Colors.primaryGlow,
    top: '35%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.45,
    height: width * 0.45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
