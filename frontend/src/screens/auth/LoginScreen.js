import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, authError, clearError } = useAuth();
  const [role, setRole] = useState('tenant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Error shake animation
  const shakeAnim = useState(new Animated.Value(0))[0];

  // Clear errors when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (authError) clearError();
  }, [email, password, role]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    // Client-side validation
    if (!email.trim()) {
      setLocalError('Please enter your email address');
      triggerShake();
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    setLocalError('');

    const result = await login(email.trim().toLowerCase(), password, role);

    if (result.success) {
      // Navigate to Home – reset so user can't go back to login
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else {
      setLocalError(result.message);
      triggerShake();
    }

    setIsSubmitting(false);
  };

  const errorMessage = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Background Image ── */}
      <View style={styles.bgContainer}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLYoX4dNkKd1RgiSGbxyhiJzo10mcKOC651jx7NNFHGJufCi62eXDsRjMjHu-mfxhAffIB12CjlPHpnPelB0ogtYIlN5WTKGVSjog4nv9BZmWsiwClDsZbdhtPnw98sNXTbyUwA-lTumFnU5k9dnh1QITeZjTNJ4Noi55OKBF4ONsV2ZRJyjvyJTksmnfQhijWYySQiSVnLVyqroMqXX6SlREdDy79mgzMlWSKUoloyGNMw6zdYI9QwAXvYhMT0Yed-ki4kwytPo' }}
          style={styles.bgImage}
          imageStyle={{ opacity: 0.1 }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(247,249,251,0.4)', Colors.background, Colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Home');
          }}
        >
          <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand / Intro ── */}
          <View style={styles.introSection}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="maps-home-work" size={32} color="#fff" />
            </View>
            <Text style={styles.brandName}>RentEase</Text>
            <Text style={styles.tagline}>Welcome back. Sign in to continue.</Text>
          </View>

          {/* ── Role Selector ── */}
          <View style={styles.roleToggle}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'tenant' && styles.roleBtnActive]}
              onPress={() => setRole('tenant')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="person"
                size={18}
                color={role === 'tenant' ? Colors.secondary : Colors.onSurfaceVariant}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roleBtnText, role === 'tenant' && styles.roleBtnTextActive]}>
                Tenant
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'owner' && styles.roleBtnActive]}
              onPress={() => setRole('owner')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="real-estate-agent"
                size={18}
                color={role === 'owner' ? Colors.secondary : Colors.onSurfaceVariant}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roleBtnText, role === 'owner' && styles.roleBtnTextActive]}>
                Owner
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Error Alert ── */}
          {errorMessage ? (
            <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
              <MaterialIcons name="error-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          ) : null}

          {/* ── Form Inputs ── */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#64748b', '#475569'] : [Colors.primary, '#1e293b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitText}>Signing in…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>Continue to Dashboard</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Social Login OR ── */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="apple" size={20} color={Colors.primary} />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Admin Login (Real-world discreet entry) ── */}
          <TouchableOpacity 
            style={styles.adminFooter} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <MaterialIcons name="lock" size={12} color={Colors.outline} />
            <Text style={styles.adminFooterText}>Admin? Login here</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Intro
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },

  // Toggle
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  roleBtnTextActive: {
    color: Colors.primary,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Form
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.onSurface,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.85,
  },
  submitGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(197, 198, 205, 0.4)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.outline,
    letterSpacing: 1.5,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },

  // Admin Footer
  adminFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    opacity: 0.7,
  },
  adminFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.outline,
    letterSpacing: 0.3,
  },
});
