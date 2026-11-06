import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '@/src/constants/theme';

export interface PaystackSuccessResponse {
  reference: string;
  status: 'success';
  channel: string;
  amount: number;
  cardLast4?: string;
  cardBrand?: string;
}

interface PaystackModalProps {
  visible: boolean;
  amount: number;
  currency?: string;
  email: string;
  purpose?: string; // 'Wallet Funding' or 'Order Checkout'
  onSuccess: (response: PaystackSuccessResponse) => void;
  onClose: () => void;
}

type PaystackChannel = 'card' | 'transfer' | 'ussd';

export function PaystackModal({
  visible,
  amount,
  currency = '$',
  email,
  purpose = 'Payment',
  onSuccess,
  onClose,
}: PaystackModalProps) {
  const [channel, setChannel] = useState<PaystackChannel>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('Alex Johnson');
  const [isProcessing, setIsProcessing] = useState(false);

  // 3D Secure / OTP Challenge state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState('');

  // Selected Bank for USSD
  const [selectedBank, setSelectedBank] = useState('GTBank (*737#)');

  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
      setShowOtpScreen(false);
      setIsSuccess(false);
      setOtpCode('');
      setOtpError(null);
    }
  }, [visible]);

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  // Quick preset test card auto-fill
  const handleUsePresetCard = (type: 'visa' | 'mastercard') => {
    if (type === 'visa') {
      setCardNumber('4084 0840 8408 4081');
      setExpiry('12/28');
      setCvv('408');
      setCardHolder('Alex Johnson');
    } else {
      setCardNumber('5123 4567 8901 2345');
      setExpiry('09/27');
      setCvv('512');
      setCardHolder('Alex Johnson');
    }
  };

  const getCardBrand = (number: string): { name: string; icon: keyof typeof Ionicons.glyphMap; color: string } => {
    const clean = number.replace(/\s/g, '');
    if (clean.startsWith('4')) {
      return { name: 'Visa', icon: 'card', color: '#1A1F71' };
    }
    if (clean.startsWith('5')) {
      return { name: 'Mastercard', icon: 'card', color: '#EB001B' };
    }
    if (clean.startsWith('506') || clean.startsWith('650')) {
      return { name: 'Verve', icon: 'card', color: '#00425F' };
    }
    return { name: 'Card', icon: 'card-outline', color: '#64748B' };
  };

  const generateReference = () => {
    return `PSTK_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Card Payment Trigger
  const handleCardPayment = () => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit debit or credit card number.');
      return;
    }
    if (expiry.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid MM/YY expiry date.');
      return;
    }
    if (cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter the 3-digit CVV from the back of the card.');
      return;
    }

    setIsProcessing(true);

    // If Mastercard test card: simulate 3D Secure OTP verification
    const requiresOtp = cleanCard.startsWith('5');

    setTimeout(() => {
      setIsProcessing(false);
      if (requiresOtp) {
        setShowOtpScreen(true);
      } else {
        completePayment('card', cleanCard.slice(-4), 'Visa');
      }
    }, 1200);
  };

  // Handle OTP submission
  const handleVerifyOtp = () => {
    if (!otpCode.trim() || otpCode.length < 4) {
      setOtpError('Please enter the 6-digit OTP code (e.g. 123456).');
      return;
    }
    setIsProcessing(true);
    setOtpError(null);

    setTimeout(() => {
      setIsProcessing(false);
      setShowOtpScreen(false);
      const cleanCard = cardNumber.replace(/\s/g, '');
      completePayment('card', cleanCard.slice(-4), 'Mastercard');
    }, 1000);
  };

  // Handle Bank Transfer confirmation
  const handleBankTransferPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      completePayment('bank_transfer');
    }, 1500);
  };

  // Handle USSD confirmation
  const handleUssdPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      completePayment('ussd');
    }, 1200);
  };

  const completePayment = (usedChannel: string, last4?: string, brand?: string) => {
    const ref = generateReference();
    setConfirmedRef(ref);
    setIsSuccess(true);

    setTimeout(() => {
      onSuccess({
        reference: ref,
        status: 'success',
        channel: usedChannel,
        amount,
        cardLast4: last4 || '4081',
        cardBrand: brand || 'Visa',
      });
    }, 1200);
  };

  const cardBrandInfo = getCardBrand(cardNumber);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          {/* Paystack Official Cyan Header */}
          <View style={styles.paystackHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.paystackBadgeIcon}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.paystackBrand}>paystack</Text>
                <Text style={styles.paystackSub}>SECURED PAYMENT GATEWAY</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Amount & Purpose Banner */}
          <View style={styles.amountBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.purposeLabel}>{purpose}</Text>
              <Text style={styles.emailLabel}>{email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountText}>
                {currency}{amount.toFixed(2)}
              </Text>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>TEST MODE</Text>
              </View>
            </View>
          </View>

          {/* If Payment Succeeded */}
          {isSuccess ? (
            <View style={styles.successState}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>
                Verified and approved by Paystack Gateway
              </Text>

              <View style={styles.receiptSummary}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Amount Paid</Text>
                  <Text style={styles.receiptRowVal}>
                    {currency}{amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Reference</Text>
                  <Text style={[styles.receiptRowVal, { fontFamily: 'monospace' }]}>
                    {confirmedRef}
                  </Text>
                </View>
                <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.receiptRowLabel}>Channel</Text>
                  <Text style={styles.receiptRowVal}>
                    {channel.toUpperCase()}
                  </Text>
                </View>
              </View>
              <ActivityIndicator size="small" color="#0BA4DB" style={{ marginTop: 16 }} />
              <Text style={styles.autoRedirectText}>Finalizing transaction...</Text>
            </View>
          ) : showOtpScreen ? (
            /* 3D Secure / OTP Challenge Screen */
            <View style={styles.otpContainer}>
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark" size={32} color="#0BA4DB" />
                <Text style={styles.otpTitle}>3D Secure Verification</Text>
                <Text style={styles.otpSubtitle}>
                  Paystack sent a one-time verification passcode to your registered phone & email for card ending in {cardNumber.slice(-4)}.
                </Text>
              </View>

              <View style={styles.otpBox}>
                <Text style={styles.inputLabel}>Enter 6-digit OTP (Demo: 123456)</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  autoFocus
                />
                {otpError && <Text style={styles.errorText}>{otpError}</Text>}
              </View>

              <TouchableOpacity
                style={styles.demoFillOtp}
                onPress={() => setOtpCode('123456')}
              >
                <Ionicons name="sparkles" size={14} color="#0BA4DB" />
                <Text style={styles.demoFillOtpText}>Auto-fill Demo OTP (123456)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                    <Text style={styles.payBtnText}>Authorize Payment</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelOtpBtn}
                onPress={() => setShowOtpScreen(false)}
              >
                <Text style={styles.cancelOtpText}>Cancel & Try Another Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Main Checkout Options */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Payment Channel Tabs */}
              <View style={styles.channelTabs}>
                <TouchableOpacity
                  style={[styles.channelTab, channel === 'card' && styles.channelTabActive]}
                  onPress={() => setChannel('card')}
                >
                  <Ionicons
                    name="card"
                    size={16}
                    color={channel === 'card' ? '#0BA4DB' : '#64748B'}
                  />
                  <Text style={[styles.channelTabText, channel === 'card' && styles.channelTabTextActive]}>
                    Card
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.channelTab, channel === 'transfer' && styles.channelTabActive]}
                  onPress={() => setChannel('transfer')}
                >
                  <Ionicons
                    name="business"
                    size={16}
                    color={channel === 'transfer' ? '#0BA4DB' : '#64748B'}
                  />
                  <Text style={[styles.channelTabText, channel === 'transfer' && styles.channelTabTextActive]}>
                    Transfer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.channelTab, channel === 'ussd' && styles.channelTabActive]}
                  onPress={() => setChannel('ussd')}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={16}
                    color={channel === 'ussd' ? '#0BA4DB' : '#64748B'}
                  />
                  <Text style={[styles.channelTabText, channel === 'ussd' && styles.channelTabTextActive]}>
                    USSD
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Channel 1: Card */}
              {channel === 'card' && (
                <View style={styles.tabContent}>
                  {/* Preset Test Cards Quick Fill */}
                  <View style={styles.presetSection}>
                    <Text style={styles.presetTitle}>Test Cards (1-Tap Fill):</Text>
                    <View style={styles.presetRow}>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => handleUsePresetCard('visa')}
                      >
                        <Ionicons name="card" size={13} color="#1A1F71" />
                        <Text style={styles.presetChipText}>Visa (Instant Success)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.presetChip, { borderColor: '#FED7AA' }]}
                        onPress={() => handleUsePresetCard('mastercard')}
                      >
                        <Ionicons name="shield-checkmark" size={13} color="#D97706" />
                        <Text style={styles.presetChipText}>Mastercard (3DS / OTP)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Number Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CARD NUMBER</Text>
                    <View style={styles.cardInputWrapper}>
                      <Ionicons
                        name={cardBrandInfo.icon}
                        size={20}
                        color={cardBrandInfo.color}
                        style={{ marginRight: 8 }}
                      />
                      <TextInput
                        style={styles.cardTextInput}
                        value={cardNumber}
                        onChangeText={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        keyboardType="numeric"
                        maxLength={19}
                        placeholderTextColor="#94A3B8"
                      />
                      {cardNumber.length >= 16 && (
                        <Text style={[styles.cardBrandLabel, { color: cardBrandInfo.color }]}>
                          {cardBrandInfo.name}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Expiry & CVV Row */}
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                      <TextInput
                        style={styles.input}
                        value={expiry}
                        onChangeText={handleExpiryChange}
                        placeholder="MM/YY"
                        keyboardType="numeric"
                        maxLength={5}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV / CVC</Text>
                      <TextInput
                        style={styles.input}
                        value={cvv}
                        onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={4}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Cardholder Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={cardHolder}
                      onChangeText={setCardHolder}
                      placeholder="Name on Card"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Pay Button */}
                  <TouchableOpacity
                    style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                    onPress={handleCardPayment}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                        <Text style={styles.payBtnText}>
                          Pay {currency}{amount.toFixed(2)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Channel 2: Bank Transfer */}
              {channel === 'transfer' && (
                <View style={styles.tabContent}>
                  <View style={styles.virtualAccountCard}>
                    <View style={styles.virtualHeader}>
                      <Ionicons name="business" size={20} color="#0BA4DB" />
                      <Text style={styles.virtualBank}>Wema Bank • Titan Paystack</Text>
                    </View>

                    <Text style={styles.accountNumberLabel}>Virtual Account Number</Text>
                    <Text style={styles.accountNumber}>0123 984 712</Text>

                    <View style={styles.virtualRow}>
                      <Text style={styles.virtualSubLabel}>Beneficiary:</Text>
                      <Text style={styles.virtualSubVal}>ShopPulse / Paystack Checkout</Text>
                    </View>

                    <View style={styles.virtualRow}>
                      <Text style={styles.virtualSubLabel}>Expires in:</Text>
                      <Text style={[styles.virtualSubVal, { color: Colors.danger }]}>29:45 mins</Text>
                    </View>
                  </View>

                  <Text style={styles.transferInstructions}>
                    Transfer exactly {currency}{amount.toFixed(2)} to the dedicated account above. Your transaction will be confirmed automatically.
                  </Text>

                  <TouchableOpacity
                    style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                    onPress={handleBankTransferPayment}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.payBtnText}>I Have Sent the Money</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Channel 3: USSD */}
              {channel === 'ussd' && (
                <View style={styles.tabContent}>
                  <Text style={styles.inputLabel}>CHOOSE YOUR BANK</Text>
                  {['GTBank (*737#)', 'Access Bank (*901#)', 'Zenith Bank (*966#)', 'UBA (*919#)'].map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bankChoice, selectedBank === b && styles.bankChoiceActive]}
                      onPress={() => setSelectedBank(b)}
                    >
                      <Ionicons
                        name={selectedBank === b ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selectedBank === b ? '#0BA4DB' : '#94A3B8'}
                      />
                      <Text style={[styles.bankChoiceText, selectedBank === b && styles.bankChoiceTextActive]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.ussdDialBox}>
                    <Text style={styles.ussdDialCode}>
                      {selectedBank.includes('737') ? '*737*50*125#' : '*901*000*125#'}
                    </Text>
                    <Text style={styles.ussdDialLabel}>
                      Dial this USSD code on your mobile phone to complete payment.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                    onPress={handleUssdPayment}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                        <Text style={styles.payBtnText}>Verify USSD Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Security Trust Footer */}
              <View style={styles.securityFooter}>
                <Ionicons name="lock-closed" size={14} color="#64748B" />
                <Text style={styles.securityFooterText}>
                  PCI-DSS Level 1 Certified • 256-Bit SSL Secured by Paystack
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  paystackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0BA4DB',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paystackBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0786B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paystackBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  paystackSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0F2FE',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  purposeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0BA4DB',
  },
  testBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  testBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  channelTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  channelTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  channelTabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  channelTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  channelTabTextActive: {
    color: '#0BA4DB',
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  presetSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 1,
  },
  cardBrandLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0BA4DB',
    borderRadius: BorderRadius.md,
    height: 50,
    marginTop: 8,
    gap: 8,
  },
  payBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  virtualAccountCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  virtualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  virtualBank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountNumberLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0BA4DB',
    letterSpacing: 2,
    marginVertical: 4,
  },
  virtualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  virtualSubLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  virtualSubVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  transferInstructions: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginVertical: 14,
  },
  bankChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  bankChoiceActive: {
    borderColor: '#0BA4DB',
    backgroundColor: '#F0F9FF',
  },
  bankChoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  bankChoiceTextActive: {
    color: '#0BA4DB',
    fontWeight: '700',
  },
  ussdDialBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  ussdDialCode: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0BA4DB',
    letterSpacing: 1,
  },
  ussdDialLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  securityFooterText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  otpContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  otpSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  otpBox: {
    width: '100%',
    marginBottom: 12,
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#0BA4DB',
    borderRadius: BorderRadius.md,
    height: 52,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#0F172A',
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 4,
    textAlign: 'center',
  },
  demoFillOtp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  demoFillOtpText: {
    fontSize: 12,
    color: '#0BA4DB',
    fontWeight: '700',
  },
  cancelOtpBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelOtpText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  successState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Shadows.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  receiptSummary: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptRowVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  autoRedirectText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
});
