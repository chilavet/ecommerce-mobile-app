import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { checkBiometrics, authenticateWithBiometrics, BiometricStatus } from '@/src/utils/biometrics';

export default function ProfileScreen() {
  const { user, login, register, logout, biometricsEnabled, setBiometricsEnabled } = useAuth();

  // Biometrics State
  const [biometrics, setBiometrics] = useState<BiometricStatus>({
    isAvailable: false,
    hasHardware: false,
    isEnrolled: false,
    biometricType: 'none',
    biometricName: 'Biometrics',
  });

  // Auth Modal State
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    async function initBio() {
      const status = await checkBiometrics();
      setBiometrics(status);
    }
    initBio();
  }, []);

  const handleBiometricLogin = async () => {
    const result = await authenticateWithBiometrics(
      `Sign in with ${biometrics.biometricName}`
    );

    if (result.success) {
      // Authenticate with saved/demo credentials
      await login('alex@example.com', 'password123');
      setAuthModalVisible(false);
      Alert.alert('Authenticated', `Welcome back! Signed in with ${biometrics.biometricName}.`);
    } else if (result.notEnrolled) {
      Alert.alert(
        `${biometrics.biometricName} Not Enrolled`,
        'No fingerprint is registered on this device/emulator yet. Would you like to simulate successful biometric sign-in?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Biometric Sign In',
            onPress: async () => {
              await login('alex@example.com', 'password123');
              setAuthModalVisible(false);
              Alert.alert('Success', 'Simulated biometric sign-in successful!');
            },
          },
        ]
      );
    } else if (result.error) {
      setAuthError(result.error);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      setAuthError('Email and password are required.');
      return;
    }

    if (authMode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setAuthError(res.error || 'Failed to sign in.');
      } else {
        setAuthModalVisible(false);
        resetForm();
      }
    } else {
      if (!name.trim()) {
        setAuthError('Please enter your full name.');
        return;
      }
      const res = await register(name, email, password, phone);
      if (!res.success) {
        setAuthError(res.error || 'Failed to register.');
      } else {
        setAuthModalVisible(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAuthError(null);
  };

  const handleFillDemo = () => {
    setEmail('alex@example.com');
    setPassword('password123');
    setAuthError(null);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* User Header Profile Card */}
      <View style={[styles.profileCard, Shadows.sm]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user ? user.name.charAt(0).toUpperCase() : 'G'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user ? user.name : 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user ? user.email : 'Sign in to sync your cart & orders'}</Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>

        {user ? (
          <TouchableOpacity style={styles.authActionBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.authActionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => {
              setAuthMode('login');
              setAuthModalVisible(true);
            }}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {!user && (
        <View style={[styles.guestBanner, Shadows.sm]}>
          <Ionicons name="sparkles" size={24} color={Colors.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.guestBannerTitle}>Create an Account</Text>
            <Text style={styles.guestBannerSubtitle}>
              Save your shipping address, track orders, and get personalized deals.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.guestBannerBtn}
            onPress={() => {
              setAuthMode('register');
              setAuthModalVisible(true);
            }}
          >
            <Text style={styles.guestBannerBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Settings Menu */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.menuHeader}>Account & Preferences</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/settings')}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Security & Settings</Text>
            <Text style={styles.menuSubLabel}>Password, fingerprint, delete account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuRow}>
          <View style={styles.menuIconWrapper}>
            <Ionicons
              name={biometrics.biometricType === 'facial' ? 'scan-outline' : 'finger-print'}
              size={20}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Biometric Sign-In</Text>
            <Text style={styles.menuSubLabel}>
              Use {biometrics.biometricName} for fast checkout & login
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
            thumbColor={biometricsEnabled ? Colors.primary : '#F8FAFC'}
          />
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>Order History</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/checkout')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>Saved Shipping Addresses</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Payment Methods', 'Cards: Visa ending in 4242 (Default)')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="card-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>Payment Options</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Notifications', 'Push notifications enabled for order tracking.')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Support & App Info */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.menuHeader}>Support & Info</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Customer Care', 'Email: support@shoppulse.app\nPhone: +1 800 555 0199')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.menuLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('About ShopPulse', 'ShopPulse v1.0.0\nPowered by Expo, React Native & SQLite')}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.menuLabel}>About ShopPulse</Text>
          <Text style={styles.versionTag}>v1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
      <Modal
        visible={authModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {authError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {authMode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={styles.inputLabel}>Phone (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="alex@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {authMode === 'login' && (
              <>
                <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin} activeOpacity={0.8}>
                  <Ionicons
                    name={biometrics.biometricType === 'facial' ? 'scan-outline' : 'finger-print'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.biometricBtnText}>
                    Sign In with {biometrics.biometricName}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.demoFillBtn} onPress={handleFillDemo}>
                  <Ionicons name="flash-outline" size={14} color={Colors.primary} />
                  <Text style={styles.demoFillText}>Auto-fill Demo Credentials</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleAuthSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitModalBtnText}>
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeBtn}
              onPress={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
            >
              <Text style={styles.switchModeText}>
                {authMode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  authActionBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  guestBannerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  guestBannerBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  guestBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  menuSubLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: BorderRadius.md,
    marginTop: 12,
  },
  biometricBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  versionTag: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  submitModalBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  switchModeBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  switchModeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});

