import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { checkBiometrics, BiometricStatus } from '@/src/utils/biometrics';

export default function SettingsScreen() {
  const { user, biometricsEnabled, setBiometricsEnabled, changePassword, deleteAccount } = useAuth();

  // Biometric status
  const [biometrics, setBiometrics] = useState<BiometricStatus>({
    isAvailable: false,
    hasHardware: false,
    isEnrolled: false,
    biometricType: 'none',
    biometricName: 'Biometrics',
  });

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  // Delete Account State
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadBiometrics() {
      const status = await checkBiometrics();
      setBiometrics(status);
    }
    loadBiometrics();
  }, []);

  const handleChangePassword = async () => {
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ isError: true, message: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ isError: true, message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ isError: true, message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordFeedback({ isError: false, message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordFeedback({ isError: true, message: result.error || 'Failed to update password.' });
      }
    } catch {
      setPasswordFeedback({ isError: true, message: 'An error occurred while updating password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await deleteAccount();
              if (res.success) {
                Alert.alert('Account Deleted', 'Your account has been permanently removed.');
                router.replace('/');
              } else {
                Alert.alert('Error', res.error || 'Failed to delete account.');
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings & Security',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Biometric Authentication Toggle */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={biometrics.biometricType === 'facial' ? 'scan-outline' : 'finger-print'}
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{biometrics.biometricName} Security</Text>
              <Text style={styles.cardSubtitle}>
                {biometrics.hasHardware
                  ? `Hardware ready on this device (${biometrics.biometricName})`
                  : 'Biometric hardware not detected'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>Enable {biometrics.biometricName}</Text>
              <Text style={styles.settingDescription}>
                Use your {biometrics.biometricName.toLowerCase()} for rapid sign-in and 1-tap checkout authorization.
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
              thumbColor={biometricsEnabled ? Colors.primary : '#F8FAFC'}
            />
          </View>

          <View style={styles.statusBadge}>
            <Ionicons
              name={biometricsEnabled ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={biometricsEnabled ? Colors.success : Colors.light.textMuted}
            />
            <Text
              style={[
                styles.statusText,
                { color: biometricsEnabled ? Colors.success : Colors.light.textMuted },
              ]}
            >
              {biometricsEnabled
                ? `${biometrics.biometricName} function is currently ACTIVE`
                : `${biometrics.biometricName} function is DISABLED`}
            </Text>
          </View>
        </View>

        {/* Section 2: Change Password */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="key-outline" size={22} color={Colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardSubtitle}>Update your secret account password</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {passwordFeedback && (
            <View
              style={[
                styles.feedbackBox,
                { backgroundColor: passwordFeedback.isError ? '#FEE2E2' : '#DCFCE7' },
              ]}
            >
              <Ionicons
                name={passwordFeedback.isError ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={passwordFeedback.isError ? Colors.danger : Colors.success}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: passwordFeedback.isError ? Colors.danger : '#15803D' },
                ]}
              >
                {passwordFeedback.message}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Current Password</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={Colors.light.textMuted}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.light.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor={Colors.light.textMuted}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.light.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-type new password"
              placeholderTextColor={Colors.light.textMuted}
              secureTextEntry={!showNewPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.savePasswordBtn, isUpdatingPassword && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={isUpdatingPassword}
            activeOpacity={0.8}
          >
            {isUpdatingPassword ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.savePasswordBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* App Info & Splash Screen */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>App Identity &amp; Splash</Text>
              <Text style={styles.cardSubtitle}>ShopPulse v1.0.0 (Nigeria Edition 🇳🇬)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.replaySplashBtn}
            onPress={() => router.push('/splash')}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.replaySplashBtnText}>View Splash Screen</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Delete Account (Danger Zone) */}
        <View style={[styles.card, styles.dangerCard, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: Colors.danger }]}>Delete Account</Text>
              <Text style={styles.cardSubtitle}>Permanent and irreversible action</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.dangerNotice}>
            Deleting your account will permanently wipe your profile, saved shipping addresses, order histories, and credentials from local storage.
          </Text>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && { opacity: 0.7 }]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dangerCard: {
    borderColor: '#FECACA',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  eyeBtn: {
    padding: 4,
  },
  savePasswordBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  savePasswordBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  replaySplashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    height: 44,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  replaySplashBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  dangerNotice: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  deleteBtn: {
    backgroundColor: Colors.danger,
    height: 44,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
