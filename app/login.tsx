import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

export default function LoginScreen() {
  const { user, login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to tabs
  if (!authLoading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to sign in.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (!res.success) {
        Alert.alert('Sign In Failed', res.error || 'Invalid email or password.');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('alex@example.com');
    setPassword('password123');
  };

  const handleInstantDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      const res = await login('alex@example.com', 'password123');
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Demo Sign In Failed', res.error || 'Could not log into demo account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding Section */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoIconCircle, Shadows.md]}>
            <Ionicons name="storefront" size={36} color="#FFFFFF" />
            <View style={styles.pulseDot} />
          </View>

          <Text style={styles.brandTitle}>ShopPulse</Text>
          <Text style={styles.brandSubtitle}>
            Fast, simple, and secure mobile shopping
          </Text>
        </View>

        {/* Sign In Form Card */}
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.cardHeaderTitle}>Sign In to Your Account</Text>
          <Text style={styles.cardHeaderSubtitle}>
            Welcome back! Enter your login credentials below.
          </Text>

          {/* Email Input */}
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. alex@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email.length > 0 && (
              <TouchableOpacity onPress={() => setEmail('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.passwordLabelRow}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TouchableOpacity onPress={handleQuickDemoFill}>
              <Text style={styles.demoLinkText}>Use Demo Login</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Primary Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSignIn}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>QUICK DEMO</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 1-Tap Demo Access */}
          <TouchableOpacity
            style={styles.demoQuickButton}
            onPress={handleInstantDemoLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color="#059669" />
            <Text style={styles.demoQuickButtonText}>
              1-Tap Demo Access (Alex Johnson)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Footer */}
        <View style={styles.footerSecurity}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.footerSecurityText}>
            256-bit SSL Security • Encrypted Login
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  demoQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    gap: 8,
  },
  demoQuickButtonText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  footerSecurity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: 6,
  },
  footerSecurityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});

