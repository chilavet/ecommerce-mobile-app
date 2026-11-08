import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';
import { formatNaira } from '../utils/currency';
import { updateOrderStatus } from '../database/db';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

interface StepConfig {
  key: OrderStatus;
  title: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  detail: string;
}

const ORDER_STEPS: StepConfig[] = [
  {
    key: 'placed',
    title: 'Order Placed',
    shortLabel: 'Placed',
    icon: 'receipt-outline',
    description: 'Order confirmed & payment verified',
    detail: 'Payment authorized. Order sent to fulfillment.',
  },
  {
    key: 'processing',
    title: 'Processing',
    shortLabel: 'Processing',
    icon: 'cube-outline',
    description: 'Items packed & prepared at Lagos Hub',
    detail: 'Order is boxed, labeled and waiting for courier pickup.',
  },
  {
    key: 'shipped',
    title: 'Shipped',
    shortLabel: 'Shipped',
    icon: 'car-outline',
    description: 'In transit with SpeedAF / GIG Logistics',
    detail: 'Out for delivery. Courier on the way to destination.',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    shortLabel: 'Delivered',
    icon: 'home-outline',
    description: 'Package delivered & signed for',
    detail: 'Handed over successfully to recipient.',
  },
];

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [showItems, setShowItems] = useState(false);

  const getStageIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'placed':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setCurrentStatus(newStatus);
    await updateOrderStatus(order.id, newStatus);
    if (onStatusChange) {
      onStatusChange(order.id, newStatus);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const currentStepInfo = ORDER_STEPS[Math.max(0, currentIndex)] || ORDER_STEPS[0];

  const getBadgeColors = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'shipped':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#7DD3FC' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      default:
        return { bg: '#EFF6FF', text: Colors.primary, border: Colors.primaryLight };
    }
  };

  const badgeTheme = getBadgeColors(currentStatus);

  return (
    <View style={[styles.card, Shadows.sm]}>
      {/* 1. Header: Order ID, Date & Status Badge */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.orderNumber}>Order #{order.id.replace('ord_', '')}</Text>
            <View style={styles.nigeriaTag}>
              <Text style={styles.nigeriaTagText}>🇳🇬 NG</Text>
            </View>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border },
          ]}
        >
          <Ionicons
            name={
              currentStatus === 'delivered'
                ? 'checkmark-circle'
                : currentStatus === 'shipped'
                ? 'airplane'
                : currentStatus === 'processing'
                ? 'time'
                : 'receipt'
            }
            size={13}
            color={badgeTheme.text}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusText, { color: badgeTheme.text }]}>
            {currentStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Order Progress Tracker (Placed -> Processing -> Shipped -> Delivered) */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>ORDER PROGRESS</Text>
          <Text style={styles.progressStepCount}>
            {currentIndex >= 0 ? `Stage ${currentIndex + 1} of 4` : 'Cancelled'}
          </Text>
        </View>

        {/* Stepper Track */}
        <View style={styles.stepperContainer}>
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            const isPending = currentIndex < idx;

            return (
              <React.Fragment key={step.key}>
                {/* Step Node */}
                <TouchableOpacity
                  style={styles.stepNode}
                  onPress={() => handleUpdateStatus(step.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.circle,
                      isCompleted && styles.circleCompleted,
                      isCurrent && styles.circleCurrent,
                      isPending && styles.circlePending,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={isCurrent ? '#FFFFFF' : '#94A3B8'}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                      isCompleted && styles.stepLabelCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {step.shortLabel}
                  </Text>
                </TouchableOpacity>

                {/* Connecting Line between nodes */}
                {idx < ORDER_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      currentIndex > idx ? styles.stepLineActive : styles.stepLineInactive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Current Stage Callout Box */}
        <View style={[styles.stageBox, { backgroundColor: badgeTheme.bg }]}>
          <View style={styles.stageBoxHeader}>
            <Ionicons
              name={
                currentStatus === 'delivered'
                  ? 'checkmark-done-circle'
                  : currentStatus === 'shipped'
                  ? 'car'
                  : currentStatus === 'processing'
                  ? 'cube'
                  : 'receipt'
              }
              size={18}
              color={badgeTheme.text}
            />
            <Text style={[styles.stageBoxTitle, { color: badgeTheme.text }]}>
              {currentStepInfo.title}
            </Text>
            {currentStatus !== 'delivered' && (
              <View style={styles.pulsePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveDotText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.stageBoxDesc, { color: badgeTheme.text }]}>
            {currentStepInfo.description}
          </Text>
          <Text style={[styles.stageBoxDetail, { color: badgeTheme.text }]}>
            {currentStepInfo.detail}
          </Text>
        </View>

        {/* Fast Stage Selector (Tap to progress order) */}
        <View style={styles.stageSwitcher}>
          <Text style={styles.switcherLabel}>UPDATE PROGRESS:</Text>
          <View style={styles.switcherButtonsRow}>
            {ORDER_STEPS.map(step => (
              <TouchableOpacity
                key={step.key}
                style={[
                  styles.switcherBtn,
                  currentStatus === step.key && styles.switcherBtnActive,
                ]}
                onPress={() => handleUpdateStatus(step.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.switcherBtnText,
                    currentStatus === step.key && styles.switcherBtnTextActive,
                  ]}
                >
                  {step.shortLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 3. Items Summary & Expandable Toggle */}
      <View style={styles.itemsRow}>
        <View style={styles.thumbnails}>
          {order.items.slice(0, 3).map((item, idx) => (
            <Image
              key={idx}
              source={{ uri: item.productImage }}
              style={[styles.thumb, idx > 0 && { marginLeft: -12 }]}
            />
          ))}
          {order.items.length > 3 && (
            <View style={[styles.thumb, styles.moreThumb, { marginLeft: -12 }]}>
              <Text style={styles.moreText}>+{order.items.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryText}>
          <Text style={styles.itemsCount}>
            {order.items.reduce((s, i) => s + i.quantity, 0)} {order.items.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.totalPrice}>{formatNaira(order.total)}</Text>
        </View>
      </View>

      {/* Toggle View Items button */}
      <TouchableOpacity
        style={styles.toggleItemsBtn}
        onPress={() => setShowItems(!showItems)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleItemsText}>
          {showItems ? 'Hide Items' : 'View Ordered Items'}
        </Text>
        <Ionicons
          name={showItems ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {/* Expanded Items List */}
      {showItems && (
        <View style={styles.expandedItemsContainer}>
          {order.items.map(item => (
            <View key={item.id} style={styles.expandedItemRow}>
              <Image source={{ uri: item.productImage }} style={styles.expandedItemImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.expandedItemTitle} numberOfLines={1}>
                  {item.productTitle}
                </Text>
                <Text style={styles.expandedItemPrice}>
                  {item.quantity} × {formatNaira(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.expandedItemSubtotal}>
                {formatNaira(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 4. Footer Badges: Tracking ID & Payment Gateway */}
      <View style={styles.footerRow}>
        <View style={styles.trackingBadge}>
          <Ionicons name="barcode-outline" size={13} color="#475569" />
          <Text style={styles.trackingText}>{order.trackingNumber || 'TRK-481105-NG'}</Text>
        </View>

        <View style={styles.paymentBadge}>
          <Ionicons
            name={order.paymentMethod === 'wallet' ? 'wallet-outline' : 'card-outline'}
            size={12}
            color={order.paymentMethod === 'wallet' ? '#059669' : '#0BA4DB'}
          />
          <Text
            style={[
              styles.paymentText,
              { color: order.paymentMethod === 'wallet' ? '#059669' : '#0BA4DB' },
            ]}
          >
            {order.paymentMethod === 'wallet' ? 'Wallet Paid' : 'Card Payment'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  nigeriaTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nigeriaTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  date: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  progressSection: {
    backgroundColor: '#FAFCFF',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  progressStepCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  stepNode: {
    alignItems: 'center',
    width: 60,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleCompleted: {
    backgroundColor: '#10B981',
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  circlePending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: '#047857',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginBottom: 16,
    marginHorizontal: -4,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stageBox: {
    borderRadius: BorderRadius.md,
    padding: 10,
    marginTop: 4,
  },
  stageBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stageBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveDotText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
  },
  stageBoxDesc: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 2,
  },
  stageBoxDetail: {
    fontSize: 11,
    opacity: 0.75,
    marginTop: 2,
  },
  stageSwitcher: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFF6FF',
  },
  switcherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  switcherButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  switcherBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  switcherBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  switcherBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreThumb: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  summaryText: {
    alignItems: 'flex-end',
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 2,
  },
  toggleItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    gap: 4,
  },
  toggleItemsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  expandedItemsContainer: {
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  expandedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  expandedItemImg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
  },
  expandedItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  expandedItemPrice: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  expandedItemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  trackingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
