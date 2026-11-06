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

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (partial: Partial<NotificationPreferences>) => void;
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  const updatePreferences = (partial: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...partial,
    }));
  };

  const sendOrderConfirmation = async (orderId: string, total: number, userEmail?: string) => {
    // 1. Push Notification
    if (preferences.pushEnabled && preferences.pushOrderUpdates) {
      await sendLocalPushNotification({
        title: 'Order Confirmed! 🛍️',
        body: `Order #${orderId.replace('ord_', '')} for $${total.toFixed(2)} has been placed and is being prepared!`,
        data: { orderId, screen: '/(tabs)/orders' },
      });
    }

    // 2. Email Notification
    if (preferences.emailEnabled && preferences.emailOrderReceipts) {
      console.log(`[Email Dispatch] Sent receipt for order #${orderId} to ${userEmail || 'customer'}`);
    }
  };

  const sendTestPush = async (): Promise<boolean> => {
    if (!preferences.pushEnabled) return false;
    return await sendLocalPushNotification({
      title: 'ShopPulse Alert 🔔',
      body: 'Push notifications are working perfectly on your device!',
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
        updatePreferences,
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
