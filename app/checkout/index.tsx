import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Order, PaymentMethod } from '@/src/types';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useWallet } from '@/src/context/WalletContext';
import { PaystackModal, PaystackSuccessResponse } from '@/src/components/PaystackModal';
import { createOrder } from '@/src/database/db';
import { formatNaira } from '@/src/utils/currency';

type PaymentType = 'wallet' | 'card';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, subtotal, shippingFee, discount, total, clearCart } = useCart();
  const { sendOrderConfirmation } = useNotifications();

  // Payment method: strictly wallet or card
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('wallet');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Digital Wallet & Paystack Gateway
  const { balance, payWithWallet, hasSufficientBalance } = useWallet();
  const [paystackVisible, setPaystackVisible] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checking out.');
      return;
    }

    // 1. If Card selected: Launch Paystack card gateway modal
    if (paymentMethod === 'card') {
      setPaystackVisible(true);
      return;
    }

    // 2. If Wallet selected: Check sufficient balance
    if (paymentMethod === 'wallet') {
      if (!hasSufficientBalance(total)) {
        Alert.alert(
          'Insufficient Wallet Balance',
          `Your wallet balance (${formatNaira(balance)}) is insufficient for this order (${formatNaira(total)}).\n\nWould you like to pay with your card?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay with Card',
              onPress: () => {
                setPaymentMethod('card');
                setPaystackVisible(true);
              },
            },
          ]
        );
        return;
      }
    }

    await processOrderPlacement();
  };

  const processOrderPlacement = async (paystackRef?: string) => {
    setIsSubmitting(true);

    try {
      const orderId = `ord_${Date.now().toString().slice(-6)}`;

      // If paying via wallet: deduct balance
      if (paymentMethod === 'wallet') {
        const walletRes = await payWithWallet(total, orderId);
        if (!walletRes.success) {
          Alert.alert('Wallet Payment Failed', walletRes.error || 'Could not deduct from wallet balance.');
          setIsSubmitting(false);
          return;
        }
      }

      const newOrder: Order = {
        id: orderId,
        userId: user ? user.id : 'usr_demo',
        subtotal,
        shippingFee,
        discount,
        total,
        status: 'placed',
        paymentMethod: (paymentMethod === 'card' ? 'card' : 'wallet') as PaymentMethod,
        paymentReference: paystackRef || (paymentMethod === 'wallet' ? `WLT_${orderId}` : undefined),
        createdAt: new Date().toISOString(),
        trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}-NG`,
        items: items.map(item => ({
          id: `ord_item_${Date.now()}_${item.product.id}`,
          orderId,
          productId: item.product.id,
          productTitle: item.product.title,
          productImage: item.product.imageUrl,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      };

      await createOrder(newOrder);
      await sendOrderConfirmation(newOrder.id, newOrder.total, user?.email);
      clearCart();

      // Navigate to order confirmation
      router.replace({
        pathname: '/checkout/success',
        params: {
          orderId: newOrder.id,
          total: newOrder.total.toFixed(2),
          trackingNumber: newOrder.trackingNumber || '',
        },
      });
    } catch (err) {
      console.error('Failed to create order:', err);
      Alert.alert('Order Failed', 'Could not complete the purchase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackSuccess = async (res: PaystackSuccessResponse) => {
    setPaystackVisible(false);
    await processOrderPlacement(res.reference);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Payment Method Selection: Wallet or Card ONLY */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
          </View>

          {/* Option 1: ShopPulse Digital Wallet */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'wallet' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={paymentMethod === 'wallet' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'wallet' ? Colors.primary : Colors.light.textMuted}
            />
            <View style={[styles.methodIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.methodTitle}>Digital Wallet</Text>
                <View style={hasSufficientBalance(total) ? styles.sufficientBadge : styles.insufficientBadge}>
                  <Text style={hasSufficientBalance(total) ? styles.sufficientBadgeText : styles.insufficientBadgeText}>
                    {hasSufficientBalance(total) ? 'Ready' : 'Low Balance'}
                  </Text>
                </View>
              </View>
              <Text style={styles.methodSubtitle}>
                Balance: {formatNaira(balance)} • {hasSufficientBalance(total) ? '1-tap instant pay' : `${formatNaira(total - balance)} needed`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/wallet')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.topUpLink}
            >
              <Text style={styles.topUpLinkText}>Fund</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Option 2: Pay with Card (Paystack Secured) */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={paymentMethod === 'card' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'card' ? Colors.primary : Colors.light.textMuted}
            />
            <View style={[styles.methodIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="card-outline" size={18} color="#0BA4DB" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.methodTitle}>Pay with Card</Text>
              <Text style={styles.methodSubtitle}>Mastercard, Visa, Verve (Instant)</Text>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#0BA4DB" />
              <Text style={[styles.secureText, { color: '#0BA4DB' }]}>Secured</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Review Summary */}
        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Order Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({items.length})</Text>
            <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -{formatNaira(discount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? 'FREE' : formatNaira(shippingFee)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>{formatNaira(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Place Order Button */}
      <View style={[styles.bottomBar, Shadows.lg]}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>{formatNaira(total)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            paymentMethod === 'card' && { backgroundColor: '#0BA4DB' },
            paymentMethod === 'wallet' && { backgroundColor: '#10B981' },
            isSubmitting && { opacity: 0.7 },
          ]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderBtnText}>
                {paymentMethod === 'wallet'
                  ? `Pay ${formatNaira(total)} with Wallet`
                  : `Pay ${formatNaira(total)} with Card`}
              </Text>
              <Ionicons
                name={paymentMethod === 'card' ? 'flash' : 'lock-closed'}
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Paystack Gateway Checkout Modal */}
      <PaystackModal
        visible={paystackVisible}
        amount={total}
        currency="₦"
        email={user?.email || 'alex@example.com'}
        purpose="ShopPulse Order Checkout"
        onSuccess={handlePaystackSuccess}
        onClose={() => setPaystackVisible(false)}
      />
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
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  methodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sufficientBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  sufficientBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  insufficientBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  insufficientBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
  },
  topUpLink: {
    backgroundColor: '#0BA4DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  topUpLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paystackPill: {
    backgroundColor: '#0BA4DB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  paystackPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  methodSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  secureText: {
    color: '#0BA4DB',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bottomTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
