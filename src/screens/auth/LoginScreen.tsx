import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../utils/validation';
import { Colors } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SocialButton } from '../../components/ui/SocialButton';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useAuth } from '../../hooks/useAuth';
import { useProfessional } from '../../context/ProfessionalContext';
import { resetToChooseRole } from '../../navigation/NavigationService';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/types';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const { login, loginWithGoogle, continueAsGuest } = useAuth();
  const { setRole, clearRole } = useProfessional();

  const handleGoBackToRole = async () => {
    await clearRole();
    await setRole(null);
    resetToChooseRole();
  };
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    if (loading) return;

    console.log('[Login] Login button pressed');
    console.log('[Login] Validation passed for email:', data.email.trim());

    setLoading(true);
    try {
      console.log('[Login] Calling Supabase authentication via AuthContext.login()');
      await login(data.email, data.password);
      console.log('[Login] Authentication succeeded — RootNavigator will show Home');
    } catch (err: any) {
      console.error('[Login] Authentication error:', err?.message || err);
      Alert.alert(
        'Authentication Error',
        err?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      Alert.alert(
        'Google Sign-In Error',
        err?.message || 'Could not initiate Google authentication.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back Navigation Bar */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBackToRole}
          activeOpacity={0.75}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
          <Text style={styles.backText}>Back to Role Selection</Text>
        </TouchableOpacity>

        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/FixNest.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>FixNest</Text>
          <Text style={styles.tagline}>Your trusted home service companion.</Text>
        </View>

        {/* Auth Form Card */}
        <View style={styles.card}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="email@domain.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon={<Mail size={18} color={Colors.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={Colors.textMuted} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={18} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />
            )}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => setForgotModalVisible(true)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title="Log In"
            variant="primary"
            loading={loading}
            onPress={handleSubmit(onLoginSubmit, (validationErrors) => {
              console.log('[Login] Validation failed:', validationErrors);
            })}
            disabled={loading}
            style={styles.submitBtn}
          />

          {/* Create Account Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpLabel}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In */}
          <SocialButton
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            icon={
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/COxitduyY10Xw9w8WReAwRIxJqlj7D95AcsO_fqHfdVLwVmS-1LsVJXx4AkP0CQp47Y',
                }}
                style={{ width: 18, height: 18 }}
              />
            }
          />

          {/* Continue as Guest */}
          <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>

        </View>

        {/* Footer Legal Terms */}
        <Text style={styles.footerText}>
          By continuing, you agree to FixNest's{' '}
          <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => setForgotModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -4,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: 16,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
  },
  guestText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footerLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
