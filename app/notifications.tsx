import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useNotifications, AppNotification } from '@/src/context/NotificationContext';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    activeFilter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications;

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
    Alert.alert('Notifications', 'All notifications have been marked as read.');
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllNotifications(),
        },
      ]
    );
  };

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return { name: 'bag-check' as const, bg: '#DCFCE7', color: '#16A34A' };
      case 'promotion':
        return { name: 'pricetag' as const, bg: '#FEE2E2', color: '#DC2626' };
      case 'security':
        return { name: 'shield-checkmark' as const, bg: '#F3E8FF', color: '#9333EA' };
      case 'cart':
        return { name: 'cart' as const, bg: '#DBEAFE', color: '#2563EB' };
      default:
        return { name: 'notifications' as const, bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeRowText}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up!'}
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              unreadCount === 0 && styles.actionBtnDisabled,
            ]}
            onPress={handleMarkAllRead}
            disabled={unreadCount === 0}
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkmark-done-circle"
              size={18}
              color={unreadCount > 0 ? Colors.primary : Colors.light.textMuted}
            />
            <Text
              style={[
                styles.actionBtnText,
                unreadCount === 0 && styles.actionBtnTextDisabled,
              ]}
            >
              Mark all as read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => router.push('/notifications-settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'unread' && styles.filterTabActive]}
          onPress={() => setActiveFilter('unread')}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === 'unread' && styles.filterTabTextActive,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={Colors.light.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'unread'
                ? 'You have read all your notifications. Switch to "All" to review past updates.'
                : 'You are all caught up! Updates regarding your orders, discounts, and alerts will show here.'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreBtnText}>Browse Store</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredNotifications.map(item => {
            const iconConfig = getTypeIcon(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  !item.read && styles.cardUnread,
                  Shadows.sm,
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                {/* Left Type Icon */}
                <View
                  style={[
                    styles.typeIconContainer,
                    { backgroundColor: iconConfig.bg },
                  ]}
                >
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                {/* Main Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[
                        styles.cardTitle,
                        !item.read && styles.cardTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                  </View>

                  <Text style={styles.cardBody} numberOfLines={3}>
                    {item.body}
                  </Text>

                  {item.route && (
                    <View style={styles.actionPrompt}>
                      <Text style={styles.actionPromptText}>View details</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </View>
                  )}
                </View>

                {/* Right Actions & Unread Indicator */}
                <View style={styles.rightActions}>
                  {!item.read && <View style={styles.unreadDot} />}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteNotification(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-outline"
                      size={18}
                      color={Colors.light.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  actionBtnDisabled: {
    backgroundColor: Colors.light.borderLight,
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionBtnTextDisabled: {
    color: Colors.light.textMuted,
  },
  settingsIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.inputBg,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  clearAllBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 6,
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: '#0F172A',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  cardBody: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  deleteBtn: {
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

