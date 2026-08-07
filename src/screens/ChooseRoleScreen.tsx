import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { useProfessional } from '../context/ProfessionalContext';
import {
  User,
  Briefcase,
  ChevronRight,
  Wrench,
  Star,
  Shield,
  Zap,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ChooseRoleScreenProps {
  onChooseUser: () => void;
  onChooseProfessional: () => void;
}

export const ChooseRoleScreen: React.FC<ChooseRoleScreenProps> = ({
  onChooseUser,
  onChooseProfessional,
}) => {
  const { setRole } = useProfessional();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);
  const userCardOpacity = useSharedValue(0);
  const userCardX = useSharedValue(-40);
  const proCardOpacity = useSharedValue(0);
  const proCardX = useSharedValue(40);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    taglineOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    userCardOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    userCardX.value = withDelay(400, withSpring(0, { damping: 14, stiffness: 80 }));
    proCardOpacity.value = withDelay(550, withTiming(1, { duration: 500 }));
    proCardX.value = withDelay(550, withSpring(0, { damping: 14, stiffness: 80 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const userCardStyle = useAnimatedStyle(() => ({
    opacity: userCardOpacity.value,
    transform: [{ translateX: userCardX.value }],
  }));

  const proCardStyle = useAnimatedStyle(() => ({
    opacity: proCardOpacity.value,
    transform: [{ translateX: proCardX.value }],
  }));

  const handleChooseUser = async () => {
    await setRole('user');
    onChooseUser();
  };

  const handleChooseProfessional = async () => {
    await setRole('professional');
    onChooseProfessional();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background gradient orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.container}>
        {/* Logo + Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Image
            source={require('../../assets/FixNest.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>FixNest</Text>
          <Text style={styles.brandTagline}>AI Household Services</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineRow, taglineStyle]}>
          <Text style={styles.chooseTitle}>How would you like to continue?</Text>
          <Text style={styles.chooseSub}>
            Select your role to get a personalized experience
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* User Card */}
          <Animated.View style={[styles.cardWrapper, userCardStyle]}>
            <TouchableOpacity
              style={styles.userCard}
              onPress={handleChooseUser}
              activeOpacity={0.85}
            >
              <View style={styles.cardGlow} />
              <View style={styles.cardIconCircle}>
                <User size={32} color={Colors.primary} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Continue as User</Text>
                <Text style={styles.cardDesc}>
                  Book home repair services, track jobs, and chat with AI
                </Text>
              </View>

              <View style={styles.cardFeatures}>
                {['Book 50+ services', 'AI diagnosis', 'Real-time tracking'].map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>Get Started</Text>
                <ChevronRight size={18} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Professional Card */}
          <Animated.View style={[styles.cardWrapper, proCardStyle]}>
            <TouchableOpacity
              style={styles.proCard}
              onPress={handleChooseProfessional}
              activeOpacity={0.85}
            >
              <View style={styles.proCardGlow} />
              <View style={styles.proBadge}>
                <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.proBadgeText}>EARN MONEY</Text>
              </View>

              <View style={styles.proCardIconCircle}>
                <Briefcase size={32} color="#A855F7" />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.proCardTitle}>Continue as Professional</Text>
                <Text style={styles.proCardDesc}>
                  Register your skills, accept bookings, and grow your business
                </Text>
              </View>

              <View style={styles.cardFeatures}>
                {['Accept booking requests', 'In-app customer chat', 'Track your earnings'].map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={[styles.featureDot, { backgroundColor: '#A855F7' }]} />
                    <Text style={[styles.featureText, { color: Colors.textSecondary }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.cardCta, { borderTopColor: 'rgba(168,85,247,0.15)' }]}>
                <Text style={[styles.cardCtaText, { color: '#A855F7' }]}>Join as Pro</Text>
                <ChevronRight size={18} color="#A855F7" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Trust badges */}
        <Animated.View style={[styles.trustRow, taglineStyle]}>
          <View style={styles.trustBadge}>
            <Shield size={13} color={Colors.success} />
            <Text style={styles.trustText}>Verified</Text>
          </View>
          <View style={styles.trustBadge}>
            <Zap size={13} color={Colors.primary} />
            <Text style={styles.trustText}>Instant Booking</Text>
          </View>
          <View style={styles.trustBadge}>
            <Wrench size={13} color={Colors.warning} />
            <Text style={styles.trustText}>52+ Services</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  orb1: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(168,85,247,0.07)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  taglineRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chooseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  chooseSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  cardsContainer: {
    gap: 14,
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
  },
  cardWrapper: {
    flex: 1,
    maxHeight: 220,
  },
  // User Card
  userCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderGlow,
    padding: 18,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  cardIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardContent: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  cardFeatures: {
    gap: 4,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.15)',
    paddingTop: 10,
    gap: 4,
  },
  cardCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  // Pro Card
  proCard: {
    flex: 1,
    backgroundColor: 'rgba(168,85,247,0.06)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(168,85,247,0.3)',
    padding: 18,
    overflow: 'hidden',
  },
  proCardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  proBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A855F7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  proCardIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(168,85,247,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  proCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  proCardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  // Trust row
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
