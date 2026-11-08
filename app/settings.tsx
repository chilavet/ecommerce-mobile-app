import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';

export default function SettingsScreen() {
  const { user, changePassword, deleteAccount } = useAuth();
  const { isDark, colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Settings & Security',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Change Password */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E293B' : '#FEF3C7' }]}>
              <Ionicons name="key-outline" size={22} color={Colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Change Password</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Update your secret account password</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {passwordFeedback && (
            <View
              style={[
                styles.feedbackBox,
                { backgroundColor: passwordFeedback.isError ? (isDark ? '#450A0A' : '#FEE2E2') : (isDark ? '#064E3B' : '#DCFCE7') },
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
                  { color: passwordFeedback.isError ? Colors.danger : (isDark ? '#6EE7B7' : '#15803D') },
                ]}
              >
                {passwordFeedback.message}
              </Text>
            </View>
          )}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Password</Text>
          <View style={[styles.passwordInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password</Text>
          <View style={[styles.passwordInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New Password</Text>
          <View style={[styles.passwordInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-type new password"
              placeholderTextColor={colors.textMuted}
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

        {/* Section 3: Delete Account (Danger Zone) */}
        <View style={[styles.card, styles.dangerCard, { backgroundColor: colors.card, borderColor: isDark ? '#7F1D1D' : '#FECACA' }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: Colors.danger }]}>Delete Account</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Permanent and irreversible action</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.dangerNotice, { color: colors.textSecondary }]}>
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
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
    marginBottom: 4,
    marginTop: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
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
  dangerNotice: {
    fontSize: 13,
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
