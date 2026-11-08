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
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useLocation } from '@/src/context/LocationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useWallet } from '@/src/context/WalletContext';
import { getOrders, getAddresses, saveAddress } from '@/src/database/db';
import { LocationPickerModal } from '@/src/components/LocationPickerModal';
import { formatNaira } from '@/src/utils/currency';
import { Address } from '@/src/types';

const PRESET_AVATARS = [
  { id: 'av_1', label: 'Classic Alex', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { id: 'av_2', label: 'Professional Male', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { id: 'av_3', label: 'Smiling Female', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { id: 'av_4', label: 'Casual Youth', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
  { id: 'av_5', label: 'Executive Woman', uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
  { id: 'av_6', label: 'Creative Artist', uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80' },
];

function formatMemberDate(isoString?: string): string {
  if (!isoString) return 'November 2024';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'November 2024';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'November 2024';
  }
}

export default function ProfileScreen() {
  const { user, login, register, updateProfile, logout } = useAuth();
  const { currentLocation } = useLocation();
  const { unreadCount } = useNotifications();
  const { balance, currency } = useWallet();

  // Orders count & address state
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [userAddress, setUserAddress] = useState<Address | null>(null);

  // Modals state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Avatar Modal State
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Edit Details Modal State
  const [editDetailsModalVisible, setEditDetailsModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const userId = user ? user.id : 'usr_demo';
      const [userOrders, addresses] = await Promise.all([
        getOrders(userId),
        getAddresses(userId),
      ]);
      setOrdersCount(userOrders.length);
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;
      setUserAddress(defaultAddr);
    } catch {
      setOrdersCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  useEffect(() => {
    if (user?.avatarUrl) {
      setSelectedAvatarUri(user.avatarUrl);
    }
  }, [user]);

  // Avatar Handlers
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Photo Error', err?.message || 'Failed to select photo from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera access to snap a new profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Camera is not available on this device. You can pick from gallery or select a preset avatar.');
    }
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setIsSavingAvatar(true);
    try {
      const res = await updateProfile({ avatarUrl: selectedAvatarUri || undefined });
      if (res.success) {
        setAvatarModalVisible(false);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        Alert.alert('Error', res.error || 'Failed to update profile picture.');
      }
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setSelectedAvatarUri(null);
    if (!user) return;
    setIsSavingAvatar(true);
    try {
      const res = await updateProfile({ avatarUrl: '' });
      if (res.success) {
        setAvatarModalVisible(false);
        Alert.alert('Photo Removed', 'Profile picture reset to default initials.');
      }
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Edit Details Handlers
  const handleOpenEditProfile = () => {
    if (!user) {
      setAuthMode('login');
      setAuthModalVisible(true);
      return;
    }
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditStreet(userAddress?.street || '14 Admiralty Way, Lekki Phase 1');
    setEditCity(userAddress?.city || currentLocation.city || 'Lekki');
    setEditState(userAddress?.state || currentLocation.state || 'Lagos State');
    setEditError(null);
    setEditDetailsModalVisible(true);
  };

  const handleSaveDetails = async () => {
    setEditError(null);
    if (!editName.trim()) {
      setEditError('Please enter your full name.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid email address.');
      return;
    }
    if (!editPhone.trim()) {
      setEditError('Please enter a contact phone number.');
      return;
    }

    setIsSavingDetails(true);
    try {
      // 1. Update User Profile
      const userRes = await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });

      if (!userRes.success) {
        setEditError(userRes.error || 'Failed to update personal details.');
        setIsSavingDetails(false);
        return;
      }

      // 2. Save Updated Address
      const updatedAddr = await saveAddress({
        id: userAddress?.id || `addr_${Date.now()}`,
        userId: user!.id,
        fullName: editName.trim(),
        street: editStreet.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        postalCode: userAddress?.postalCode || '106104',
        country: userAddress?.country || 'Nigeria',
        phone: editPhone.trim(),
        isDefault: true,
      });
      setUserAddress(updatedAddr);

      setEditDetailsModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details and delivery address have been updated successfully.');
    } catch {
      setEditError('Failed to save profile changes. Please try again.');
    } finally {
      setIsSavingDetails(false);
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
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
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
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => {
            if (user) {
              setSelectedAvatarUri(user.avatarUrl || null);
              setAvatarModalVisible(true);
            }
          }}
          activeOpacity={0.8}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
          )}
          {user && (
            <View style={styles.avatarCameraBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

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
          {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
        </View>

        {user ? (
          <TouchableOpacity
            style={styles.editProfileBtnHeader}
            onPress={handleOpenEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={Colors.primary} />
            <Text style={styles.editProfileBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
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
            {userAddress?.city || currentLocation.city || 'Location'}
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

      {/* 2.5 Personal Details Section ("See My Details") */}
      {user && (
        <View style={[styles.menuSection, Shadows.sm]}>
          <View style={styles.detailsHeaderRow}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity
              style={styles.editPillSmall}
              onPress={handleOpenEditProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={12} color={Colors.primary} />
              <Text style={styles.editPillSmallText}>Edit Info</Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user.name}</Text>
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="mail-outline" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call-outline" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>
                {user.phone || 'No phone added'}
              </Text>
            </View>
            {!user.phone && (
              <TouchableOpacity onPress={handleOpenEditProfile}>
                <Text style={styles.addPhoneText}>+ Add Phone</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Primary Delivery Address */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="home-outline" size={18} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Default Delivery Address</Text>
              <Text style={styles.detailValue}>
                {userAddress?.street
                  ? `${userAddress.street}, ${userAddress.city}, ${userAddress.state}`
                  : (currentLocation.formattedAddress || 'Lekki Phase 1, Lagos State')}
              </Text>
            </View>
          </View>

          {/* Account Status / Member Since */}
          <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 2 }]}>
            <View style={[styles.detailIcon, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Account Verification</Text>
              <Text style={styles.detailValue}>
                Verified Shopper • Member since {formatMemberDate(user.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 3. Section: Wallet & Payment */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.sectionTitle}>Wallet &amp; Payment</Text>

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
            <Text style={styles.menuSubLabel}>Wallet &amp; Card (Mastercard, Visa, Verve)</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. Section: Settings & Preferences */}
      <View style={[styles.menuSection, Shadows.sm]}>
        <Text style={styles.sectionTitle}>App &amp; Security Settings</Text>

        {/* Security & Password -> single source of truth for passwords */}
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
              Change password, delete account
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
          onPress={() => router.push('/customer-care')}
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
          onPress={() => router.push('/about')}
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
                <Text style={styles.paymentCardTitle}>ShopPulse Wallet</Text>
                <Text style={styles.paymentCardSubtitle}>
                  Balance: {formatNaira(balance)} • 1-tap pay
                </Text>
              </View>
              <View style={[styles.defaultBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.defaultBadgeText, { color: Colors.primary }]}>OPEN</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Pay with Card */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="card-outline" size={22} color="#0BA4DB" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paymentCardTitle}>Pay with Card</Text>
                <Text style={styles.paymentCardSubtitle}>Mastercard, Visa, Verve • Instant</Text>
              </View>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>ACTIVE</Text>
              </View>
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
              <TouchableOpacity style={styles.demoFillBtn} onPress={handleFillDemo}>
                <Ionicons name="flash-outline" size={14} color={Colors.primary} />
                <Text style={styles.demoFillText}>Auto-fill Demo Account</Text>
              </TouchableOpacity>
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

      {/* 7. Change Profile Picture Modal */}
      <Modal
        visible={avatarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, Shadows.lg]}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Profile Picture</Text>
                <Text style={styles.modalSubTitle}>Choose a photo or select a stylish avatar</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {/* Current Selected Avatar Preview */}
            <View style={styles.avatarPreviewContainer}>
              {selectedAvatarUri ? (
                <Image source={{ uri: selectedAvatarUri }} style={styles.avatarPreviewImage} />
              ) : (
                <View style={[styles.avatarCircle, { width: 90, height: 90, borderRadius: 45 }]}>
                  <Text style={[styles.avatarInitials, { fontSize: 32 }]}>
                    {user ? user.name.charAt(0).toUpperCase() : 'G'}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Upload Action Buttons */}
            <View style={styles.avatarActionsRow}>
              <TouchableOpacity
                style={styles.avatarActionBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={18} color={Colors.primary} />
                <Text style={styles.avatarActionBtnText}>Photo Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarActionBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                <Text style={styles.avatarActionBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Preset Avatars Grid */}
            <Text style={styles.presetSectionTitle}>OR CHOOSE A PRESET AVATAR</Text>
            <View style={styles.presetsGrid}>
              {PRESET_AVATARS.map(av => {
                const isSelected = selectedAvatarUri === av.uri;
                return (
                  <TouchableOpacity
                    key={av.id}
                    style={[styles.presetAvatarItem, isSelected && styles.presetAvatarSelected]}
                    onPress={() => setSelectedAvatarUri(av.uri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: av.uri }} style={styles.presetAvatarImage} />
                    {isSelected && (
                      <View style={styles.presetCheckmark}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions */}
            <TouchableOpacity
              style={[styles.submitModalBtn, isSavingAvatar && { opacity: 0.7 }]}
              onPress={handleSaveAvatar}
              disabled={isSavingAvatar}
              activeOpacity={0.85}
            >
              {isSavingAvatar ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalBtnText}>Save Profile Picture</Text>
              )}
            </TouchableOpacity>

            {selectedAvatarUri ? (
              <TouchableOpacity
                style={styles.removeAvatarBtn}
                onPress={handleRemoveAvatar}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                <Text style={styles.removeAvatarBtnText}>Remove Photo (Use Initials)</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 8. Edit Personal Information Modal */}
      <Modal
        visible={editDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditDetailsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditDetailsModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, Shadows.lg]}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile Information</Text>
                <Text style={styles.modalSubTitle}>Update your name, contact and delivery address</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditDetailsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {editError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Full Name */}
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="person-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Email */}
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. alex@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="call-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="e.g. +234 803 123 4567"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Delivery Street */}
              <Text style={styles.inputLabel}>STREET ADDRESS</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="home-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={editStreet}
                  onChangeText={setEditStreet}
                  placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* City & State Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CITY</Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="location-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.fieldInput}
                      value={editCity}
                      onChangeText={setEditCity}
                      placeholder="e.g. Lekki"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>STATE</Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="map-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.fieldInput}
                      value={editState}
                      onChangeText={setEditState}
                      placeholder="e.g. Lagos State"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitModalBtn, isSavingDetails && { opacity: 0.7 }]}
              onPress={handleSaveDetails}
              disabled={isSavingDetails}
              activeOpacity={0.85}
            >
              {isSavingDetails ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalBtnText}>Save Profile Changes</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    paddingBottom: 110,
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
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editProfileBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  editProfileBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  editPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  editPillSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  addPhoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalSubTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarPreviewImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatarActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  presetSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  presetAvatarItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetAvatarSelected: {
    borderColor: Colors.primary,
  },
  presetAvatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  presetCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  removeAvatarBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.light.text,
  },
});
