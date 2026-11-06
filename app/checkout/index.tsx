import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Address, Order } from '@/src/types';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { getAddresses, saveAddress, createOrder } from '@/src/database/db';
import { checkBiometrics, authenticateWithBiometrics, BiometricStatus } from '@/src/utils/biometrics';
import { Switch } from 'react-native';

type PaymentType = 'card' | 'apple_pay' | 'cod';

export default function CheckoutScreen() {
  const { user, biometricsEnabled, setBiometricsEnabled } = useAuth();
  const { items, subtotal, shippingFee, discount, total, clearCart } = useCart();
  const { sendOrderConfirmation } = useNotifications();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);

  // New address form fields
  const [fullName, setFullName] = useState(user ? user.name : '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Biometric Payment Security
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

  useEffect(() => {
    async function loadAddress() {
      const userId = user ? user.id : 'usr_demo';
      const addrs = await getAddresses(userId);
      setAddresses(addrs);
      if (addrs.length > 0) {
        const defaultOne = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultOne.id);
      } else {
        setShowAddressForm(true);
      }
    }
    loadAddress();
  }, [user]);

  const handleSaveNewAddress = async () => {
    if (!fullName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Required Fields', 'Please complete the shipping address fields.');
      return;
    }

    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      userId: user ? user.id : 'usr_demo',
      fullName,
      street,
      city,
      state: state || 'CA',
      postalCode,
      country: 'United States',
      phone: phone || '+1 (555) 000-0000',
      isDefault: true,
    };

    await saveAddress(newAddr);
    setAddresses(prev => [newAddr, ...prev]);
    setSelectedAddressId(newAddr.id);
    setShowAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checking out.');
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddr) {
      Alert.alert('Shipping Address', 'Please select or add a delivery address.');
      return;
    }

    if (biometricsEnabled) {
      const bioAuth = await authenticateWithBiometrics(
        `Confirm payment of $${total.toFixed(2)} with ${biometrics.biometricName}`
      );

      if (bioAuth.notEnrolled) {
        Alert.alert(
          `${biometrics.biometricName} Setup`,
          `No biometric credential is set up on this emulator/device yet. Would you like to authorize this payment via simulated ${biometrics.biometricName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Authorize & Place Order',
              onPress: () => processOrderPlacement(selectedAddr),
            },
          ]
        );
        return;
      }

      if (!bioAuth.success) {
        Alert.alert('Biometric Verification', bioAuth.error || 'Authentication failed. Please try again.');
        return;
      }
    }

    await processOrderPlacement(selectedAddr);
  };

  const processOrderPlacement = async (selectedAddr: Address) => {
    setIsSubmitting(true);

    try {
      const orderId = `ord_${Date.now().toString().slice(-6)}`;
      const newOrder: Order = {
        id: orderId,
        userId: user ? user.id : 'usr_demo',
        subtotal,
        shippingFee,
        discount,
        total,
        status: 'placed',
        paymentMethod,
        shippingAddress: selectedAddr,
        createdAt: new Date().toISOString(),
        trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}-US`,
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Delivery Address */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Shipping Address</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddressForm(!showAddressForm)}>
              <Text style={styles.actionLinkText}>
                {showAddressForm ? 'Cancel' : '+ Add New'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddressForm ? (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Recipient Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
              />

              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={street}
                onChangeText={setStreet}
                placeholder="123 Main Street, Apt 4B"
              />

              <View style={styles.row}>
                <View style={{ flex: 2, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="90210"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveAddressBtn} onPress={handleSaveNewAddress}>
                <Text style={styles.saveAddressBtnText}>Use This Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {addresses.map(addr => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressItem,
                    selectedAddressId === addr.id && styles.addressItemSelected,
                  ]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <Ionicons
                    name={selectedAddressId === addr.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedAddressId === addr.id ? Colors.primary : Colors.light.textMuted}
                  />
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>{addr.fullName}</Text>
                    <Text style={styles.addressStreet}>
                      {addr.street}, {addr.city}, {addr.postalCode}
                    </Text>
                    <Text style={styles.addressPhone}>{addr.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Section 2: Payment Method */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons
              name={paymentMethod === 'card' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'card' ? Colors.primary : Colors.light.textMuted}
            />
            <Ionicons name="card-outline" size={22} color={Colors.light.text} style={styles.methodIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Credit or Debit Card</Text>
              <Text style={styles.methodSubtitle}>Visa ending in 4242</Text>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.secureText}>Encrypted</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'apple_pay' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('apple_pay')}
          >
            <Ionicons
              name={paymentMethod === 'apple_pay' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'apple_pay' ? Colors.primary : Colors.light.textMuted}
            />
            <Ionicons name="logo-apple" size={22} color={Colors.light.text} style={styles.methodIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Apple Pay / Google Pay</Text>
              <Text style={styles.methodSubtitle}>Fast one-touch checkout</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Ionicons
              name={paymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'cod' ? Colors.primary : Colors.light.textMuted}
            />
            <Ionicons name="cash-outline" size={22} color={Colors.light.text} style={styles.methodIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Cash on Delivery</Text>
              <Text style={styles.methodSubtitle}>Pay upon receiving package</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2.5: Biometric Authorization */}
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.biometricRow}>
            <View style={styles.biometricIconWrapper}>
              <Ionicons
                name={biometrics.biometricType === 'facial' ? 'scan-outline' : 'finger-print'}
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.biometricTitle}>{biometrics.biometricName} Security</Text>
              <Text style={styles.biometricSubtitle}>
                Require biometric verification to approve this transaction
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
              thumbColor={biometricsEnabled ? Colors.primary : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Section 3: Order Review Summary */}
        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Order Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({items.length})</Text>
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
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Place Order Button */}
      <View style={[styles.bottomBar, Shadows.lg]}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderBtnText}>Place Order</Text>
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </>
          )}
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
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  addressItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  addressInfo: {
    marginLeft: 10,
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addressStreet: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  formContainer: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  row: {
    flexDirection: 'row',
  },
  saveAddressBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 14,
  },
  saveAddressBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
  methodIcon: {
    marginHorizontal: 10,
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
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  secureText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  biometricSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
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

