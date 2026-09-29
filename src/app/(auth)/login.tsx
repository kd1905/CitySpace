import { useAuth } from '@/features/auth/AuthContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const VILLA_IMAGE = require('@/assets/images/luxury-villa-dusk.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { login, continueAsGuest, lastAuthError, clearAuthError } = useAuth();

  const isDesktop = width >= 920;

  const [activePortal, setActivePortal] = useState<'admin' | 'agent'>('admin');
  const [email, setEmail] = useState('admin@cityspace.luxury');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedEmail = localStorage.getItem('cityspace_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        if (savedEmail.toLowerCase().includes('agent')) {
          setActivePortal('agent');
        }
      }
    }
  }, []);

  const handlePortalSwitch = (portal: 'admin' | 'agent') => {
    setActivePortal(portal);
    setErrorMessage('');
    clearAuthError();
    if (portal === 'admin') {
      setEmail('admin@cityspace.luxury');
      setPassword('admin123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleLogin = async (overrideEmail?: string, overridePass?: string) => {
    const targetEmail = (overrideEmail || email).trim();
    const targetPass = (overridePass || password).trim();

    if (!targetEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!targetPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    clearAuthError();

    try {
      const success = await login(targetEmail, targetPass);
      setLoading(false);

      if (!success) {
        setErrorMessage(lastAuthError || 'Invalid credentials. Please check your email and password.');
        return;
      }

      if (rememberMe && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cityspace_remember_email', targetEmail);
      } else if (!rememberMe && typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('cityspace_remember_email');
      }

      // Seamless role-based redirect
      if (activePortal === 'agent' || !targetEmail.toLowerCase().includes('admin')) {
        router.replace('/agent/dashboard' as any);
      } else {
        router.replace('/admin' as any);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleDemoAccess = () => {
    if (activePortal === 'admin') {
      setEmail('admin@cityspace.luxury');
      setPassword('admin123');
      handleLogin('admin@cityspace.luxury', 'admin123');
    } else {
      setEmail('agent@cityspace.in');
      setPassword('agent123');
      handleLogin('agent@cityspace.in', 'agent123');
    }
  };

  const handleBackToWebsite = () => {
    continueAsGuest();
    router.replace('/(tabs)' as any);
  };

  return (
    <ScrollView
      style={styles.scrollViewBase}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={[styles.mainCard, !isDesktop && styles.mainCardMobile]}>
        {/* ================================================================= */}
        {/* LEFT COLUMN: VISUAL HERO PANEL (Shown on Desktop) */}
        {/* ================================================================= */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            {/* Background Image */}
            <Image
              source={VILLA_IMAGE}
              style={styles.backgroundImage}
              resizeMode="cover"
            />

            {/* Dark Dramatic Gradient Overlay */}
            <LinearGradient
              colors={[
                'rgba(15, 23, 42, 0.45)',
                'rgba(15, 23, 42, 0.15)',
                'rgba(15, 23, 42, 0.75)',
                'rgba(15, 23, 42, 0.94)',
              ]}
              locations={[0, 0.35, 0.7, 1]}
              style={styles.gradientOverlay}
            />

            {/* Content Container */}
            <View style={styles.leftContent}>
              {/* Top Branding */}
              <View style={styles.brandRow}>
                <View style={styles.brandLogoBox}>
                  <Text style={styles.brandLogoC}>C</Text>
                  <View style={styles.brandLogoDot} />
                </View>
                <View style={styles.brandTextCol}>
                  <Text style={styles.brandName}>CITYSPACE</Text>
                  <Text style={styles.brandTagline}>REAL ESTATE SIMPLIFIED</Text>
                </View>
              </View>

              {/* Main Headline */}
              <View style={styles.headlineWrapper}>
                <Text style={styles.heroHeadline}>
                  Better{'\n'}Spaces.{'\n'}Brighter{'\n'}Tomorrows.
                </Text>
                <Text style={styles.heroSubhead}>
                  Manage properties, agents,{'\n'}and enquiries — all in one place.
                </Text>
              </View>

              {/* Bottom Quote & Feature Badges */}
              <View style={styles.leftBottomSection}>
                {/* Glassmorphic Quote Box */}
                <View style={styles.quoteCard}>
                  <View style={styles.quoteAmberBar} />
                  <View style={styles.quoteTextCol}>
                    <Text style={styles.quoteText}>
                      “Good administration{'\n'}builds great communities.”
                    </Text>
                    <Text style={styles.quoteAuthor}>CITYSPACE</Text>
                  </View>
                </View>

                {/* Feature Pills */}
                <View style={styles.featuresRow}>
                  <View style={styles.featurePill}>
                    <View style={styles.featureIconBox}>
                      <Feather name="bar-chart-2" size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.featureText}>Manage{'\n'}Properties</Text>
                  </View>

                  <View style={styles.featurePill}>
                    <View style={styles.featureIconBox}>
                      <Feather name="users" size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.featureText}>Empower{'\n'}Agents</Text>
                  </View>

                  <View style={styles.featurePill}>
                    <View style={styles.featureIconBox}>
                      <Feather name="message-square" size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.featureText}>Track{'\n'}Enquiries</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* RIGHT COLUMN: LOGIN FORM */}
        {/* ================================================================= */}
        <View style={styles.rightPanel}>
          {/* Top-Right: Back to Website */}
          <View style={styles.backRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBackToWebsite}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={13} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.backBtnText}>Back to Website</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content Wrapper */}
          <View style={styles.formContainer}>
            {/* Center Logo */}
            <View style={styles.centerLogoWrapper}>
              <View style={styles.centerLogoBox}>
                <Text style={styles.centerLogoC}>C</Text>
                <View style={styles.centerLogoDot} />
              </View>
              <Text style={styles.centerBrandTitle}>CITYSPACE</Text>

              {/* Portal Badge with Toggle */}
              <View style={styles.portalToggleRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePortalSwitch('admin')}
                  style={[
                    styles.portalPill,
                    activePortal === 'admin'
                      ? styles.portalPillAdminActive
                      : styles.portalPillInactive,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={11}
                    color={activePortal === 'admin' ? '#92400E' : '#64748B'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.portalPillText,
                      activePortal === 'admin'
                        ? styles.portalPillTextAdminActive
                        : styles.portalPillTextInactive,
                    ]}
                  >
                    ADMIN PORTAL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePortalSwitch('agent')}
                  style={[
                    styles.portalPill,
                    activePortal === 'agent'
                      ? styles.portalPillAgentActive
                      : styles.portalPillInactive,
                  ]}
                >
                  <Feather
                    name="briefcase"
                    size={11}
                    color={activePortal === 'agent' ? '#0369A1' : '#64748B'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.portalPillText,
                      activePortal === 'agent'
                        ? styles.portalPillTextAgentActive
                        : styles.portalPillTextInactive,
                    ]}
                  >
                    AGENT PORTAL
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Welcome Back Title */}
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>
                {activePortal === 'admin'
                  ? 'Sign in to access your Cityspace admin dashboard.'
                  : 'Sign in to access your Cityspace advisor leads desk.'}
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorAlert}>
                <Feather name="alert-circle" size={14} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.fieldBlock}>
              <Text style={styles.inputLabel}>Email / Username</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={15} color="#94A3B8" style={styles.inputLeftIcon} />
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your email or username"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={15} color="#94A3B8" style={styles.inputLeftIcon} />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rememberRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberMeGroup}
              >
                <View style={[styles.checkboxBox, rememberMe && styles.checkboxBoxChecked]}>
                  {rememberMe && <Feather name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setForgotEmail(email);
                  setForgotSubmitted(false);
                  setForgotModalVisible(true);
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleLogin()}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.primaryButtonLoading]}
            >
              <Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'Signing In...'
                  : activePortal === 'admin'
                    ? 'Sign In to Admin Dashboard'
                    : 'Sign In to Agent Portal'}
              </Text>
            </TouchableOpacity>

            {/* Divider OR */}
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Demo Access Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDemoAccess}
              style={styles.demoButton}
            >
              <Feather name="zap" size={14} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.demoButtonText}>
                {activePortal === 'admin'
                  ? 'Use Demo Admin Access'
                  : 'Use Demo Agent Access'}
              </Text>
            </TouchableOpacity>

            {/* Restricted Access Callout */}
            <View style={styles.restrictedCallout}>
              <View style={styles.restrictedIconBox}>
                <Feather name="shield" size={15} color="#475569" />
              </View>
              <View style={styles.restrictedTextCol}>
                <Text style={styles.restrictedTitle}>Restricted Access</Text>
                <Text style={styles.restrictedBody}>
                  {activePortal === 'admin'
                    ? 'This portal is for authorized Cityspace administrators only. Normal users, buyers, and tenants cannot manage property records.'
                    : 'This portal is for certified Cityspace real estate advisors only. Client leads are assigned exclusively by administrators.'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Feather name="key" size={24} color="#0284C7" />
            </View>

            <Text style={styles.modalHeaderTitle}>Password Reset Request</Text>
            <Text style={styles.modalHeaderSub}>
              For verified system security, credentials for Cityspace Administrators and Advisors are managed centrally by the Root Administrator.
            </Text>

            {forgotSubmitted ? (
              <View style={styles.submittedBox}>
                <Feather name="check-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.submittedText}>
                  Reset request logged for {forgotEmail || 'your account'}. Please contact your administrator or support@cityspace.in to complete verification.
                </Text>
              </View>
            ) : (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={styles.inputLabel}>Enter Registered Email</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={15} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="advisor@cityspace.in"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              {!forgotSubmitted && (
                <TouchableOpacity
                  onPress={() => setForgotSubmitted(true)}
                  style={styles.modalSubmitBtn}
                >
                  <Text style={styles.modalSubmitText}>Submit Request</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewBase: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        width: '100vw',
      } as any,
    }),
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        width: '100%',
      } as any,
    }),
  },
  mainCard: {
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    flex: 1,
    ...Platform.select({
      web: {
        minHeight: '100vh',
      } as any,
    }),
  },
  mainCardMobile: {
    flexDirection: 'column',
    width: '100%',
    minHeight: '100%',
  },

  /* ========================================================================= */
  /* LEFT HERO PANEL */
  /* ========================================================================= */
  leftPanel: {
    flex: 1.08,
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftContent: {
    flex: 1,
    padding: 38,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexDirection: 'row',
  },
  brandLogoC: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  brandLogoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginLeft: 1,
    marginTop: 6,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 1,
  },
  headlineWrapper: {
    marginVertical: 20,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  heroSubhead: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13.5,
    lineHeight: 21,
    marginTop: 14,
    fontWeight: '400',
  },
  leftBottomSection: {
    gap: 14,
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' } as any,
    }),
  },
  quoteAmberBar: {
    width: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginRight: 12,
  },
  quoteTextCol: {
    flex: 1,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  quoteAuthor: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 6,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' } as any,
    }),
  },
  featureIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },

  /* ========================================================================= */
  /* RIGHT FORM PANEL */
  /* ========================================================================= */
  rightPanel: {
    flex: 1,
    paddingHorizontal: 42,
    paddingTop: 28,
    paddingBottom: 34,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  backRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  centerLogoWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  centerLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    flexDirection: 'row',
  },
  centerLogoC: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  centerLogoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginLeft: 1,
    marginTop: 6,
  },
  centerBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3.5,
    color: '#0F172A',
    marginBottom: 10,
  },
  portalToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  portalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  portalPillAdminActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  portalPillAgentActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  portalPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  portalPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  portalPillTextAdminActive: {
    color: '#92400E',
  },
  portalPillTextAgentActive: {
    color: '#0369A1',
  },
  portalPillTextInactive: {
    color: '#64748B',
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  fieldBlock: {
    marginBottom: 13,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },

  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  rememberMeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  rememberMeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalHeaderSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  submittedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  submittedText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 44,
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  primaryButtonLoading: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },

  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
    borderRadius: 8,
    marginBottom: 16,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  restrictedCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  restrictedIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  restrictedTextCol: {
    flex: 1,
  },
  restrictedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  restrictedBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});
