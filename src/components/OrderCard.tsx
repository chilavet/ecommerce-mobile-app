import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';
import { formatNaira } from '../utils/currency';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' };
      case 'shipped':
        return { bg: '#DBEAFE', text: '#1D4ED8', icon: 'airplane' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#B45309', icon: 'time' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle' };
      default:
        return { bg: '#F1F5F9', text: '#475569', icon: 'cube' };
    }
  };

  const statusConfig = getStatusColor(order.status);
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Order #{order.id.replace('ord_', '')}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

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
            {order.items.reduce((s, i) => s + i.quantity, 0)} items
          </Text>
          <Text style={styles.totalPrice}>{formatNaira(order.total)}</Text>
        </View>
      </View>

      {order.shippingAddress && (
        <View style={styles.shippingInfo}>
          <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.shippingText} numberOfLines={1}>
            Ship to: {order.shippingAddress.street}, {order.shippingAddress.city}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
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
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.md,
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
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  shippingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
});

