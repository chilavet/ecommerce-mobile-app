import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useCart } from '@/src/context/CartContext';
import { CartItemRow } from '@/src/components/CartItemRow';

export default function CartScreen() {
  const {
    items,
    clearCart,
    subtotal,
    shippingFee,
    discount,
    total,
    appliedPromo,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyPromo(promoInput);
    setPromoFeedback({
      isError: !res.success,
      message: res.message,
    });
    if (res.success) {
      setPromoInput('');
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={60} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Looks like you haven't added any products to your bag yet.
        </Text>
        <TouchableOpacity
          style={styles.shopNowBtn}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.shopNowText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top summary row */}
        <View style={styles.topBar}>
          <Text style={styles.itemsCountText}>{items.length} unique items</Text>
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Item Rows */}
        {items.map(item => (
          <CartItemRow key={item.product.id} item={item} />
        ))}

        {/* Promo Code Box */}
        <View style={[styles.promoBox, Shadows.sm]}>
          <Text style={styles.boxTitle}>Have a coupon?</Text>

          {appliedPromo ? (
            <View style={styles.appliedPromoBadge}>
              <View style={styles.appliedPromoInfo}>
                <Ionicons name="pricetag" size={16} color={Colors.success} />
                <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                <Text style={styles.appliedPromoDiscount}>
                  (-{appliedPromo.discountPercentage}%)
                </Text>
              </View>
              <TouchableOpacity onPress={removePromo}>
                <Ionicons name="close-circle" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code (e.g. SAVE20)"
                placeholderTextColor={Colors.light.textMuted}
                value={promoInput}
                onChangeText={text => {
                  setPromoInput(text);
                  setPromoFeedback(null);
                }}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyPromo}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          {promoFeedback && (
            <Text
              style={[
                styles.feedbackText,
                { color: promoFeedback.isError ? Colors.danger : Colors.success },
              ]}
            >
              {promoFeedback.message}
            </Text>
          )}
        </View>

        {/* Order Summary Calculation */}
        <View style={[styles.summaryCard, Shadows.sm]}>
          <Text style={styles.boxTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -${discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              {shippingFee === 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? '$0.00' : `$${shippingFee.toFixed(2)}`}
            </Text>
          </View>

          {shippingFee > 0 && (
            <Text style={styles.shippingHint}>
              Add ${(100 - subtotal).toFixed(2)} more for FREE shipping!
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={[styles.bottomBar, Shadows.lg]}>
        <View>
          <Text style={styles.barTotalLabel}>Estimated Total</Text>
          <Text style={styles.barTotalAmount}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  promoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  promoInputRow: {
    flexDirection: 'row',
  },
  promoInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  appliedPromoBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedPromoCode: {
    fontWeight: '700',
    fontSize: 14,
    color: '#15803D',
    marginLeft: 6,
  },
  appliedPromoDiscount: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 6,
  },
  feedbackText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: 6,
  },
  freeBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  shippingHint: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 17,
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
  barTotalLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  barTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  shopNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

