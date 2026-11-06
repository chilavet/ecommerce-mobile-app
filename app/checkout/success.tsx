import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { formatNaira } from '@/src/utils/currency';

export default function OrderSuccessScreen() {
  const { orderId, total, trackingNumber } = useLocalSearchParams<{
    orderId: string;
    total: string;
    trackingNumber: string;
  }>();

  return (
    <View style={styles.container}>
      <View style={[styles.card, Shadows.lg]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully.</Text>

        <View style={styles.receiptBox}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Order Reference</Text>
            <Text style={styles.receiptValue}>#{orderId || 'ORD-SUCCESS'}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Total Paid</Text>
            <Text style={[styles.receiptValue, { color: Colors.primary, fontWeight: '800' }]}>
              {formatNaira(parseFloat(total || '0'))}
            </Text>
          </View>

          {trackingNumber && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Tracking ID</Text>
              <Text style={styles.receiptValue}>{trackingNumber}</Text>
            </View>
          )}

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Estimated Delivery</Text>
            <Text style={styles.receiptValue}>2 - 4 Business Days</Text>
          </View>
        </View>

        <View style={styles.deliveryNote}>
          <Ionicons name="mail-outline" size={18} color={Colors.primary} />
          <Text style={styles.deliveryNoteText}>
            A confirmation receipt and tracking updates have been sent to your email.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewOrdersBtn}
          onPress={() => router.replace('/(tabs)/orders')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewOrdersText}>View Order Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  receiptLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.xl,
  },
  deliveryNoteText: {
    fontSize: 12,
    color: Colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  viewOrdersBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.full,
    marginBottom: 10,
  },
  viewOrdersText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  continueBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.full,
  },
  continueText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

