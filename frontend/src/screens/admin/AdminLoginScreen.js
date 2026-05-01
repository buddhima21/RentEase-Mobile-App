import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  TextInput,
  TouchableOpacity,
  
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }
    
    setIsSubmitting(true);
    // Hardcoded to role: "admin"
    const result = await login(email.trim().toLowerCase(), password, 'admin');
    setIsSubmitting(false);

    if (result.success) {
      // Navigate to Admin Dashboard after successful login
      navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
    } else {
      setError(result.message || 'Authorization failed. This attempt has been logged.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdKMxzyJBuqMf-Gk7PAgIMQM1hrtADlE2vFpa7NgtKruwCA9lYuHLJf_SPOFJIBIb6TQTZghRZ9TKdnUCem7Dmvd4gcGYuMsNBSRf69YKYIRp5ibiAKXCsJlX5-nIRSsG9ZvYZ2IRNZttvF6GtpbGkxZKEOOAC0nhZvmd07mTR6nZEEeYWj5CC-vxX79I0nfMCjY2yEfP_U-pdGMKf6zs2g2Ra4bPBPVlEBudvL805YZlRCZWTSsWduUbwhBWBSzbqfguNk3MmUac' }}
          style={styles.bgImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(247,249,251,0.6)', 'rgba(247,249,251,0.95)', '#f7f9fb']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollGrow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="shield" size={26} color="#006591" />
              <Text style={styles.brandTitle}>RentEase</Text>
            </View>
            <View style={styles.adminBadge}>
              <MaterialIcons name="verified-user" size={14} color="#006591" />
              <Text style={styles.adminBadgeText}>ADMIN ACCESS</Text>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.mainContent}>
            
            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <MaterialIcons name="warning" size={22} color="#ba1a1a" style={{ marginTop: 2 }} />
              <View style={styles.warningTextCol}>
                <Text style={styles.warningTitle}>Restricted Access</Text>
                <Text style={styles.warningSub}>Authorized personnel only. All access attempts are logged and monitored for security purposes.</Text>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Systems Login</Text>
                <Text style={styles.cardSub}>Enter your administrative credentials to manage the RentEase ecosystem.</Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.formSpace}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Work Email</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="mail" size={20} color="#75777d" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="admin@rentease.com"
                      placeholderTextColor="rgba(117,119,125,0.6)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={20} color="#75777d" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••••••"
                      placeholderTextColor="rgba(117,119,125,0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color="#75777d"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember & Forgot */}
                <View style={styles.rowBetween}>
                  <TouchableOpacity 
                    style={styles.rememberRow}
                    activeOpacity={0.8}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                      {rememberMe && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* CTA */}
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && { opacity: 0.85 }]}
                  activeOpacity={0.85}
                  onPress={handleAdminLogin}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={['#091426', '#1e293b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Sign In to Dashboard</Text>
                        <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              <View style={styles.trustItem}>
                <MaterialIcons name="security" size={16} color="#45474c" />
                <Text style={styles.trustText}>AES-256 Encryption</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="verified" size={16} color="#45474c" />
                <Text style={styles.trustText}>ISO 27001</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="admin-panel-settings" size={16} color="#45474c" />
                <Text style={styles.trustText}>GDPR Compliant</Text>
              </View>
            </View>
          </View>

          {/* Footer inside ScrollView so it never overlaps */}
          <View style={styles.footer}>
            <Text style={styles.footerCopyright}>© {new Date().getFullYear()} RentEase Enterprise Security. All rights reserved.</Text>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerLink}>Security Standards</Text>
              <Text style={styles.footerLink}>Support</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f9fb' },
  bgImage: { width: '100%', height: '100%', opacity: 0.15 },
  keyboardView: { flex: 1 },
  scrollGrow: { flexGrow: 1, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 24 : 32,
    paddingBottom: 16,
    width: '100%',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#091426', letterSpacing: -0.5 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#45474c', letterSpacing: 1.2 },

  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  warningBanner: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
    marginBottom: 24,
  },
  warningTextCol: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '800', color: '#93000a', marginBottom: 2 },
  warningSub: { fontSize: 13, color: '#45474c', lineHeight: 18 },

  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#091426',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)',
  },
  cardHeader: { marginBottom: 32 },
  cardTitle: { fontSize: 26, fontWeight: '800', color: '#091426', letterSpacing: -0.5, marginBottom: 8 },
  cardSub: { fontSize: 14, color: '#45474c', lineHeight: 22 },

  errorBox: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: { color: '#ba1a1a', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  formSpace: { gap: 22 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#45474c', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 2 },
  inputContainer: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  input: {
    backgroundColor: '#f2f4f6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 46,
    fontSize: 15,
    color: '#191c1e',
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)',
  },
  eyeBtn: { position: 'absolute', right: 16, padding: 4 },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.4)',
  },
  checkboxActive: { backgroundColor: '#006591', borderColor: '#006591' },
  rememberText: { fontSize: 14, fontWeight: '500', color: '#45474c' },
  forgotText: { fontSize: 14, fontWeight: '700', color: '#006591' },

  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 40,
    opacity: 0.7,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 10, fontWeight: '800', color: '#45474c', textTransform: 'uppercase', letterSpacing: 1 },

  footer: {
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  footerCopyright: { fontSize: 11, color: '#8590a6', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 16 },
  footerLinks: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  footerLink: { fontSize: 11, color: '#8590a6', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
});
