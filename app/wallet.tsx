import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useWallet } from '@/src/context/WalletContext';
import { useAuth } from '@/src/context/AuthContext';
import { PaystackModal, PaystackSuccessResponse } from '@/src/components/PaystackModal';
import { formatNaira } from '@/src/utils/currency';
import { WalletTransaction } from '@/src/types';

export default function WalletScreen() {
  const { user } = useAuth();
  const { balance, currency, transactions, fundWallet } = useWallet();

  // Balance visibility toggle
  const [hideBalance, setHideBalance] = useState(false);

  // Fund Wallet Modal state
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  // Paystack Gateway Modal state
  const [paystackVisible, setPaystackVisible] = useState(false);
  const [fundingAmountNumber, setFundingAmountNumber] = useState(10000);

  // Filter state for transactions
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const handleOpenFundModal = (preset?: number) => {
    if (preset) {
      setTopUpAmount(preset.toString());
    } else {
      setTopUpAmount('');
    }
    setFundModalVisible(true);
  };

  const handleProceedToPaystack = () => {
    const num = parseFloat(topUpAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount (e.g. ₦10,000).');
      return;
    }
    setFundingAmountNumber(num);
    setFundModalVisible(false);
    // Open Paystack Gateway
    setPaystackVisible(true);
  };

  const handlePaystackSuccess = async (res: PaystackSuccessResponse) => {
    setPaystackVisible(false);
    await fundWallet(res.amount, res.reference, 'paystack');

    Alert.alert(
      'Wallet Funded! 💳',
      `Successfully added ${formatNaira(res.amount)} to your ShopPulse Wallet.\n\nTransaction Ref: ${res.reference}`,
      [{ text: 'Great!' }]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Virtual Debit / Digital Wallet Card */}
      <View style={[styles.virtualCard, Shadows.lg]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardChipRow}>
            <View style={styles.cardChip}>
              <View style={styles.cardChipInner} />
            </View>
            <Ionicons name="wifi" size={20} color="#94A3B8" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
          <View style={styles.paystackPartnerBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text style={styles.paystackPartnerText}>Verified Digital Wallet</Text>
          </View>
        </View>

        <View style={styles.cardBalanceSection}>
          <Text style={styles.balanceLabel}>AVAILABLE WALLET BALANCE</Text>
          <View style={styles.balanceValueRow}>
            <Text style={styles.balanceAmount}>
              {hideBalance ? '••••••' : formatNaira(balance)}
            </Text>
            <TouchableOpacity
              onPress={() => setHideBalance(!hideBalance)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#CBD5E1"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardHolderLabel}>CARDHOLDER</Text>
            <Text style={styles.cardHolderName}>{user ? user.name : 'Alex Johnson'}</Text>
          </View>
          <View style={styles.walletNetworkTag}>
            <Text style={styles.walletNetworkText}>ShopPulse Pay</Text>
          </View>
        </View>
      </View>

      {/* 2. Primary Action Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={[styles.fundActionBtn, Shadows.md]}
          onPress={() => handleOpenFundModal()}
          activeOpacity={0.85}
        >
          <View style={styles.fundIconCircle}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fundBtnTitle}>Fund Wallet</Text>
            <Text style={styles.fundBtnSub}>Deposit with Card, Bank Transfer or USSD</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 3. Transactions List */}
      <View style={styles.transactionsHeaderRow}>
        <View>
          <Text style={styles.transactionsTitle}>Transaction History</Text>
          <Text style={styles.transactionsSubtitle}>All credits and checkout payments</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredTransactions.length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'credit' && styles.filterTabActive]}
          onPress={() => setFilter('credit')}
        >
          <Text style={[styles.filterTabText, filter === 'credit' && styles.filterTabTextActive]}>
            Deposits (+)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'debit' && styles.filterTabActive]}
          onPress={() => setFilter('debit')}
        >
          <Text style={[styles.filterTabText, filter === 'debit' && styles.filterTabTextActive]}>
            Payments (-)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions Container */}
      <View style={[styles.txListContainer, Shadows.sm]}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyTx}>
            <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTxTitle}>No Transactions Found</Text>
            <Text style={styles.emptyTxSub}>
              Transactions will appear here when you fund your wallet or place orders.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx, idx) => (
            <View
              key={tx.id}
              style={[
                styles.txItem,
                idx === filteredTransactions.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={[
                  styles.txIconCircle,
                  tx.type === 'credit' ? styles.txCreditCircle : styles.txDebitCircle,
                ]}
              >
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={tx.type === 'credit' ? '#10B981' : '#EF4444'}
                />
              </View>

              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {tx.description.replace(/via Paystack/gi, '(Card Deposit)').replace(/Paystack/gi, 'Card')}
                </Text>
                <View style={styles.txMetaRow}>
                  <View style={styles.channelPill}>
                    <Text style={styles.channelPillText}>
                      {tx.channel === 'paystack'
                        ? 'Card Deposit'
                        : tx.channel === 'checkout'
                        ? 'Order'
                        : 'Bonus'}
                    </Text>
                  </View>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.txAmount,
                    tx.type === 'credit' ? styles.txAmountCredit : styles.txAmountDebit,
                  ]}
                >
                  {tx.type === 'credit' ? '+' : '-'}
                  {formatNaira(tx.amount)}
                </Text>
                <View style={styles.txStatusPill}>
                  <Ionicons name="checkmark-circle" size={10} color="#10B981" />
                  <Text style={styles.txStatusText}>Completed</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Fund Amount Input Modal */}
      <Modal
        visible={fundModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFundModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFundModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.fundModalCard, Shadows.lg]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.fundModalHeader}>
              <View>
                <Text style={styles.fundModalTitle}>Fund Digital Wallet</Text>
                <Text style={styles.fundModalSub}>Secure Payment Gateway</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFundModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ENTER AMOUNT TO DEPOSIT (₦)</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="numeric"
                placeholder="10000"
                autoFocus
              />
            </View>

            <View style={styles.paystackNotice}>
              <Ionicons name="shield-checkmark" size={16} color="#0BA4DB" />
              <Text style={styles.paystackNoticeText}>
                Secure 256-bit SSL encrypted deposit. Funds reflect immediately in your wallet.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.continueToPaystackBtn}
              onPress={handleProceedToPaystack}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
              <Text style={styles.continueToPaystackText}>
                {topUpAmount && parseFloat(topUpAmount) > 0
                  ? `Proceed to Deposit (${formatNaira(parseFloat(topUpAmount))})`
                  : 'Proceed to Deposit'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Paystack Payment Gateway Modal */}
      <PaystackModal
        visible={paystackVisible}
        amount={fundingAmountNumber}
        currency={currency}
        email={user?.email || 'alex@example.com'}
        purpose="ShopPulse Wallet Top-Up"
        onSuccess={handlePaystackSuccess}
        onClose={() => setPaystackVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  virtualCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#D97706',
    padding: 3,
  },
  cardChipInner: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paystackPartnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  paystackPartnerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardBalanceSection: {
    marginBottom: 22,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
  },
  cardHolderLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  walletNetworkTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  walletNetworkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  actionsBar: {
    marginBottom: Spacing.lg,
  },
  fundActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0BA4DB',
    borderRadius: BorderRadius.lg,
    padding: 16,
    gap: 14,
  },
  fundIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundBtnTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fundBtnSub: {
    fontSize: 11,
    color: '#E0F2FE',
    marginTop: 2,
  },
  quickTopUpSection: {
    marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  customChip: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  customChipText: {
    color: '#0284C7',
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  transactionsSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  txListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txCreditCircle: {
    backgroundColor: '#ECFDF5',
  },
  txDebitCircle: {
    backgroundColor: '#FEF2F2',
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  channelPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txAmountCredit: {
    color: '#059669',
  },
  txAmountDebit: {
    color: '#0F172A',
  },
  txStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  emptyTx: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptyTxSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  fundModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  fundModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  fundModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  fundModalSub: {
    fontSize: 12,
    color: '#0BA4DB',
    fontWeight: '600',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#0BA4DB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0BA4DB',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  fundModalChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  fundModalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  fundModalChipActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0BA4DB',
  },
  fundModalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  fundModalChipTextActive: {
    color: '#0BA4DB',
  },
  paystackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginBottom: 16,
  },
  paystackNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  continueToPaystackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0BA4DB',
    borderRadius: BorderRadius.lg,
    height: 52,
    gap: 8,
  },
  continueToPaystackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
