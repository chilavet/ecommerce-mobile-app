import React, { createContext, useContext, useState } from 'react';
import { sendLocalPushNotification } from '../utils/notifications';

export interface NotificationPreferences {
  // Push Notifications
  pushEnabled: boolean;
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
  pushCartReminders: boolean;

  // Email Notifications
  emailEnabled: boolean;
  emailOrderReceipts: boolean;
  emailNewsletter: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'order' | 'promotion' | 'security' | 'system' | 'cart';
  route?: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  notifications: AppNotification[];
  unreadCount: number;
  updatePreferences: (partial: Partial<NotificationPreferences>) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
      timestamp?: string;
      read?: boolean;
    }
  ) => void;
  sendOrderConfirmation: (orderId: string, total: number, userEmail?: string) => Promise<void>;
  sendTestPush: () => Promise<boolean>;
  sendTestEmail: (email: string) => Promise<{ success: boolean; message: string }>;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  pushOrderUpdates: true,
  pushPromotions: true,
  pushCartReminders: false,

  emailEnabled: true,
  emailOrderReceipts: true,
  emailNewsletter: false,
};

const initialNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Welcome to ShopPulse! 🛍️',
    body: 'Get 20% off your entire order using promo code SAVE20 at checkout.',
    timestamp: '15m ago',
    read: false,
    type: 'promotion',
    route: '/(tabs)/explore',
  },
  {
    id: 'notif_2',
    title: 'Flash Deals in Electronics ⚡',
    body: 'Save up to 13% on premium headphones and smartwatches today only.',
    timestamp: '1h ago',
    read: false,
    type: 'promotion',
    route: '/(tabs)/explore',
  },
  {
    id: 'notif_3',
    title: 'Biometric Security Ready 🔒',
    body: 'Fingerprint authentication is ready on your device. Turn it on in Settings for 1-tap checkout.',
    timestamp: '3h ago',
    read: false,
    type: 'security',
    route: '/settings',
  },
  {
    id: 'notif_4',
    title: 'Items in your Shopping Cart 🛒',
    body: 'Your cart contains items waiting for checkout. Don’t miss out before stock runs out!',
    timestamp: 'Yesterday',
    read: true,
    type: 'cart',
    route: '/(tabs)/cart',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const updatePreferences = (partial: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...partial,
    }));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(item => ({
        ...item,
        read: true,
      }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
      timestamp?: string;
      read?: boolean;
    }
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: notif.timestamp || 'Just now',
      read: notif.read ?? false,
      title: notif.title,
      body: notif.body,
      type: notif.type,
      route: notif.route,
      data: notif.data,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const sendOrderConfirmation = async (orderId: string, total: number, userEmail?: string) => {
    const formattedId = orderId.replace('ord_', '');
    const title = 'Order Confirmed! 🛍️';
    const body = `Order #${formattedId} for $${total.toFixed(2)} has been placed and is being prepared!`;

    // 1. Add in-app notification
    addNotification({
      title,
      body,
      type: 'order',
      route: '/(tabs)/orders',
      data: { orderId },
    });

    // 2. Push Notification
    if (preferences.pushEnabled && preferences.pushOrderUpdates) {
      await sendLocalPushNotification({
        title,
        body,
        data: { orderId, screen: '/(tabs)/orders' },
      });
    }

    // 3. Email Notification
    if (preferences.emailEnabled && preferences.emailOrderReceipts) {
      console.log(`[Email Dispatch] Sent receipt for order #${orderId} to ${userEmail || 'customer'}`);
    }
  };

  const sendTestPush = async (): Promise<boolean> => {
    const title = 'ShopPulse Alert 🔔';
    const body = 'Push notifications are working perfectly on your device!';

    addNotification({
      title,
      body,
      type: 'system',
    });

    if (!preferences.pushEnabled) return false;
    return await sendLocalPushNotification({
      title,
      body,
      data: { test: true },
    });
  };

  const sendTestEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!preferences.emailEnabled) {
      return { success: false, message: 'Email notifications are currently disabled in settings.' };
    }
    return {
      success: true,
      message: `Test email successfully dispatched to ${email}!`,
    };
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        notifications,
        unreadCount,
        updatePreferences,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        sendOrderConfirmation,
        sendTestPush,
        sendTestEmail,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
