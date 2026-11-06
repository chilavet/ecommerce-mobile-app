import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useNotifications } from '@/src/context/NotificationContext';
import { useAuth } from '@/src/context/AuthContext';

export default function NotificationSettingsScreen() {
  const { preferences, updatePreferences, sendTestPush, sendTestEmail } = useNotifications();
  const { user } = useAuth();

  const [sendingPush, setSendingPush] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleTestPush = async () => {
    if (!preferences.pushEnabled) {
      Alert.alert(
        'Push Disabled',
        'Please enable Push Notifications first using the switch above.'
      );
      return;
    }

    setSendingPush(true);
    try {
      await sendTestPush();
      Alert.alert(
        'Notification Sent 🔔',
        'Check your Android status bar / notification drawer on the Pixel 10 Pro!'
      );
    } catch {
      Alert.alert('Error', 'Could not send test notification.');
    } finally {
      setSendingPush(false);
    }
  };

  const handleTestEmail = async () => {
    const targetEmail = user?.email || 'alex@example.com';
    setSendingEmail(true);
    try {
      const res = await sendTestEmail(targetEmail);
      Alert.alert(res.success ? 'Email Dispatched ✉️' : 'Notice', res.message);
    } catch {
      Alert.alert('Error', 'Failed to dispatch test email.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notification Settings',
          headerBackTitle: 'Settings',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Push Notifications */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Push Notifications</Text>
              <Text style={styles.cardSubtitle}>Real-time alerts directly on your device</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Master Switch */}
          <View style={styles.masterRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.masterLabel}>Allow Push Notifications</Text>
              <Text style={styles.masterSubtitle}>Enable or mute all instant device alerts</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={val => updatePreferences({ pushEnabled: val })}
              trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
              thumbColor={preferences.pushEnabled ? Colors.primary : '#F8FAFC'}
            />
          </View>

          {/* Sub options (disabled if master is off) */}
          <View style={[styles.subOptionsContainer, !preferences.pushEnabled && styles.disabledSection]}>
            <View style={styles.subOptionRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.optionLabel}>Order Status & Tracking</Text>
                <Text style={styles.optionDescription}>
                  Get notified when orders are placed, dispatched, and delivered.
                </Text>
              </View>
              <Switch
                value={preferences.pushOrderUpdates && preferences.pushEnabled}
                disabled={!preferences.pushEnabled}
                onValueChange={val => updatePreferences({ pushOrderUpdates: val })}
                trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                thumbColor={preferences.pushOrderUpdates ? Colors.primary : '#F8FAFC'}
              />
            </View>

            <View style={styles.subOptionRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.optionLabel}>Deals & Flash Sales</Text>
                <Text style={styles.optionDescription}>
                  Exclusive coupon codes, price drops, and seasonal sales.
                </Text>
              </View>
              <Switch
                value={preferences.pushPromotions && preferences.pushEnabled}
                disabled={!preferences.pushEnabled}
                onValueChange={val => updatePreferences({ pushPromotions: val })}
                trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                thumbColor={preferences.pushPromotions ? Colors.primary : '#F8FAFC'}
              />
            </View>

            <View style={styles.subOptionRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.optionLabel}>Cart Reminders</Text>
                <Text style={styles.optionDescription}>
                  Gentle reminders when items remain in your shopping bag.
                </Text>
              </View>
              <Switch
                value={preferences.pushCartReminders && preferences.pushEnabled}
                disabled={!preferences.pushEnabled}
                onValueChange={val => updatePreferences({ pushCartReminders: val })}
                trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                thumbColor={preferences.pushCartReminders ? Colors.primary : '#F8FAFC'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.testBtn, !preferences.pushEnabled && styles.testBtnDisabled]}
            onPress={handleTestPush}
            disabled={sendingPush || !preferences.pushEnabled}
            activeOpacity={0.8}
          >
            {sendingPush ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={16}
                  color={preferences.pushEnabled ? Colors.primary : Colors.light.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.testBtnText,
                    !preferences.pushEnabled && { color: Colors.light.textMuted },
                  ]}
                >
                  Send Test Push Notification
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 2: Email Notifications */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="mail" size={22} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Email Notifications</Text>
              <Text style={styles.cardSubtitle}>
                Sent to: {user?.email || 'alex@example.com'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Master Email Switch */}
          <View style={styles.masterRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.masterLabel}>Allow Email Notifications</Text>
              <Text style={styles.masterSubtitle}>Control emails sent to your inbox</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={val => updatePreferences({ emailEnabled: val })}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={preferences.emailEnabled ? Colors.secondary : '#F8FAFC'}
            />
          </View>

          <View style={[styles.subOptionsContainer, !preferences.emailEnabled && styles.disabledSection]}>
            <View style={styles.subOptionRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.optionLabel}>Order Receipts & Invoices</Text>
                <Text style={styles.optionDescription}>
                  Detailed breakdown, tracking link, and tax invoice for each order.
                </Text>
              </View>
              <Switch
                value={preferences.emailOrderReceipts && preferences.emailEnabled}
                disabled={!preferences.emailEnabled}
                onValueChange={val => updatePreferences({ emailOrderReceipts: val })}
                trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                thumbColor={preferences.emailOrderReceipts ? Colors.secondary : '#F8FAFC'}
              />
            </View>

            <View style={styles.subOptionRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.optionLabel}>Weekly Deals & Recommendations</Text>
                <Text style={styles.optionDescription}>
                  Top-rated arrivals and tailored recommendations once a week.
                </Text>
              </View>
              <Switch
                value={preferences.emailNewsletter && preferences.emailEnabled}
                disabled={!preferences.emailEnabled}
                onValueChange={val => updatePreferences({ emailNewsletter: val })}
                trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                thumbColor={preferences.emailNewsletter ? Colors.secondary : '#F8FAFC'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.testBtn, !preferences.emailEnabled && styles.testBtnDisabled]}
            onPress={handleTestEmail}
            disabled={sendingEmail || !preferences.emailEnabled}
            activeOpacity={0.8}
          >
            {sendingEmail ? (
              <ActivityIndicator color={Colors.secondary} />
            ) : (
              <>
                <Ionicons
                  name="mail-unread-outline"
                  size={16}
                  color={preferences.emailEnabled ? Colors.secondary : Colors.light.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.testBtnText,
                    preferences.emailEnabled ? { color: Colors.secondary } : { color: Colors.light.textMuted },
                  ]}
                >
                  Send Test Email Receipt
                </Text>
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
  cardHeader: {
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
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
  },
  masterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  masterSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  subOptionsContainer: {
    paddingLeft: 4,
  },
  disabledSection: {
    opacity: 0.5,
  },
  subOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  optionDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.full,
    height: 42,
    marginTop: 14,
    backgroundColor: '#F8FAFC',
  },
  testBtnDisabled: {
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
