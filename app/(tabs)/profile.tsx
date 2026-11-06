import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useLocation } from '@/src/context/LocationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useWallet } from '@/src/context/WalletContext';
import { getOrders } from '@/src/database/db';
import { LocationPickerModal } from '@/src/components/LocationPickerModal';
import { checkBiometrics, authenticateWithBiometrics, BiometricStatus } from '@/src/utils/biometrics';
import { formatNaira } from '@/src/utils/currency';

export default function ProfileScreen() {
  const { user, login, register, logout } = useAuth();
  const { currentLocation } = useLocation();
  const { unreadCount } = useNotifications();
  const { balance, currency } = useWallet();

  // Orders count state
  const [ordersCount, setOrdersCount] = useState<number>(0);

  // Modals state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Biometrics hardware state
  const [biometrics, setBiometrics] = useState<BiometricStatus>({
    isAvailable: false,
    hasHardware: false,
    isEnrolled: false,
    biometricType: 'none',
    biometricName: 'Biometrics',
  });

  useEffect(() => {
    async function initBio() {
      const status = await checkBiometrics();
      setBiometrics(status);
    }
    initBio();
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const userId = user ? user.id : 'usr_demo';
      const userOrders = await getOrders(userId);
      setOrdersCount(userOrders.length);
    } catch {
      setOrdersCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handleBiometricLogin = async () => {
    const result = await authenticateWithBiometrics(
      `Sign in with ${biometrics.biometricName}`
    );

    if (result.success) {
      await login('alex@example.com', 'password123');
      setAuthModalVisible(false);
      Alert.alert('Authenticated', `Welcome back! Signed in with ${biometrics.biometricName}.`);
    } else if (result.notEnrolled) {
      Alert.alert(
        `${biometrics.biometricName} Not Enrolled`,
        'Simulate successful biometric sign-in for demonstration?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Sign In',
            onPress: async () => {
              await login('alex@example.com', 'password123');
              setAuthModalVisible(false);
              Alert.alert('Success', 'Biometric sign-in successful!');
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
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
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
      {/* 1. User Header Profile Card */}
      <View style={[styles.profileCard, Shadows.sm]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user ? user.name.charAt(0).toUpperCase() : 'G'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user ? user.name : 'Guest Shopper'}</Text>
            {user && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user ? user.email : 'Sign in to sync orders & saved addresses'}
          </Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>

        {!user && (
          <TouchableOpacity
            style={styles.signInPill}
            onPress={() => {
              setAuthMode('login');
              setAuthModalVisible(true);
            }}
          >
            <Text style={styles.signInPillText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Quick Overview Stats Bar */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, Shadows.sm]}
          onPress={() => router.push('/(tabs)/orders')}
          activeOpacity={0.7}
        >
          <View style={[styles.statIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="bag-handle-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{ordersCount}</Text>
          <Text style={styles.statLabel}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, Shadows.sm]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="location-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.statValue} numberOfLines={1}>
            {currentLocation.city || 'Location'}
          </Text>
          <Text style={styles.statLabel}>Delivery Hub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, Shadows.sm]}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <View style={[styles.statIconCircle, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>
            {unreadCount > 0 ? `${unreadCount} new` : 'All read'}
          </Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Section: Delivery & Payment */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.sectionTitle}>Delivery &amp; Payment</Text>

        {/* Digital Wallet */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/wallet')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="wallet-outline" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.menuLabel}>ShopPulse Wallet</Text>
              <View style={styles.walletPill}>
                <Ionicons name="flash" size={10} color="#0BA4DB" />
                <Text style={styles.walletPillText}>Paystack</Text>
              </View>
            </View>
            <Text style={styles.menuSubLabel}>
              Balance: {formatNaira(balance)} • 1-tap checkout
            </Text>
          </View>
          <View style={[styles.changeBadge, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.changeBadgeText, { color: '#059669' }]}>Fund</Text>
            <Ionicons name="chevron-forward" size={14} color="#059669" />
          </View>
        </TouchableOpacity>

        {/* Primary Delivery Address */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="navigate-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.menuLabel}>Delivery Address</Text>
            <Text style={styles.menuSubLabel} numberOfLines={1}>
              {currentLocation.formattedAddress}
            </Text>
          </View>
          <View style={styles.changeBadge}>
            <Text style={styles.changeBadgeText}>Change</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Payment Methods */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
          onPress={() => setPaymentModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="card-outline" size={20} color="#9333EA" />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.menuLabel}>Payment Options</Text>
            <Text style={styles.menuSubLabel}>Paystack, Wallet, Visa •••• 4242</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. Section: Settings & Preferences */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.sectionTitle}>App &amp; Security Settings</Text>

        {/* Security & Password -> single source of truth for passwords & biometrics */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.menuLabel}>Security &amp; Password</Text>
            <Text style={styles.menuSubLabel}>
              Biometric login, change password, delete account
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        {/* Notification Preferences */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
          onPress={() => router.push('/notifications-settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="notifications-outline" size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.menuLabel}>Notification Preferences</Text>
            <Text style={styles.menuSubLabel}>
              Push alerts, deals &amp; order email receipts
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 5. Section: Support & Info */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.sectionTitle}>Support &amp; About</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              'Customer Support',
              'Need assistance with an order or product?\n\n• Email: support@shoppulse.app\n• Phone: +1 800 555 0199\n• Hours: 24/7 Available',
              [{ text: 'Close' }]
            )
          }
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="headset-outline" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Customer Care &amp; FAQs</Text>
            <Text style={styles.menuSubLabel}>24/7 live assistance and support contacts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
          onPress={() =>
            Alert.alert(
              'About ShopPulse',
              'ShopPulse Mobile App\nVersion 1.0.0 (Build 42)\n\nBuilt with React Native, Expo SDK 58, and Local Storage.',
              [{ text: 'OK' }]
            )
          }
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>About ShopPulse</Text>
            <Text style={styles.menuSubLabel}>Version 1.0.0 • Terms &amp; Privacy</Text>
          </View>
          <Text style={styles.versionBadge}>v1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Sign Out Button (When Signed In) */}
      {user && (
        <TouchableOpacity
          style={[styles.logoutBtn, Shadows.sm]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      {/* Payment Options Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, Shadows.lg]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Payment Methods</Text>
              <TouchableOpacity
                onPress={() => setPaymentModalVisible(false)}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* 1. ShopPulse Digital Wallet */}
            <TouchableOpacity
              style={styles.paymentCard}
              onPress={() => {
                setPaymentModalVisible(false);
                router.push('/wallet');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="wallet" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.paymentCardTitle}>ShopPulse Wallet</Text>
                  <View style={styles.walletPill}>
                    <Text style={styles.walletPillText}>Paystack</Text>
                  </View>
                </View>
                <Text style={styles.paymentCardSubtitle}>
                  Balance: {currency}{balance.toFixed(2)} • 1-tap pay
                </Text>
              </View>
              <View style={[styles.defaultBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.defaultBadgeText, { color: Colors.primary }]}>OPEN</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Paystack Card & Transfer Gateway */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="flash" size={20} color="#0BA4DB" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paymentCardTitle}>Paystack Gateway</Text>
                <Text style={styles.paymentCardSubtitle}>Cards, Bank Transfer, USSD</Text>
              </View>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>ACTIVE</Text>
              </View>
            </View>

            {/* 3. Saved Visa */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="card" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paymentCardTitle}>Visa ending in 4242</Text>
                <Text style={styles.paymentCardSubtitle}>Expires 12/28 • Default Payment</Text>
              </View>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            </View>

            <View style={styles.paymentCard}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="logo-google" size={22} color="#4285F4" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paymentCardTitle}>Google Pay</Text>
                <Text style={styles.paymentCardSubtitle}>Connected on this device</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>

            <TouchableOpacity
              style={styles.addPaymentBtn}
              onPress={() => {
                Alert.alert('Add Card', 'New card addition verified successfully.');
                setPaymentModalVisible(false);
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPaymentBtnText}>Add Payment Method</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

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
                  placeholder="e.g. Alex Johnson"
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
                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.8}
                >
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
                  <Text style={styles.demoFillText}>Auto-fill Demo Account</Text>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
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
  signInPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  signInPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  guestBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    lineHeight: 16,
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
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
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  walletPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0BA4DB',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  versionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  paymentCardSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: 8,
    gap: 6,
  },
  addPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 18,
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
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: BorderRadius.md,
    marginTop: 12,
    gap: 8,
  },
  biometricBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
