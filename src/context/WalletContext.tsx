import React, { createContext, useContext, useState } from 'react';
import { WalletTransaction, WalletTransactionChannel } from '@/src/types';
import { useNotifications } from '@/src/context/NotificationContext';
import { sendLocalPushNotification } from '@/src/utils/notifications';
import { useAuth } from '@/src/context/AuthContext';

interface WalletContextType {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
  fundWallet: (
    amount: number,
    reference: string,
    channel?: WalletTransactionChannel
  ) => Promise<{ success: boolean; newBalance: number }>;
  payWithWallet: (
    amount: number,
    orderId: string
  ) => Promise<{ success: boolean; newBalance?: number; error?: string }>;
  hasSufficientBalance: (amount: number) => boolean;
  refreshTransactions: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_3',
    userId: 'usr_demo',
    type: 'credit',
    amount: 100.0,
    description: 'Wallet Top-up via Paystack',
    channel: 'paystack',
    reference: 'PSTK_PAY_894120',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'successful',
  },
  {
    id: 'tx_2',
    userId: 'usr_demo',
    type: 'debit',
    amount: 25.0,
    description: 'Payment for Order #1000',
    channel: 'checkout',
    reference: 'ORD_1000_PMT',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'successful',
  },
  {
    id: 'tx_1',
    userId: 'usr_demo',
    type: 'credit',
    amount: 50.0,
    description: 'Welcome Bonus Credit',
    channel: 'bonus',
    reference: 'BONUS_WELCOME_50',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'successful',
  },
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [balance, setBalance] = useState<number>(125.0);
  const [currency] = useState<string>('$');
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);

  const fundWallet = async (
    amount: number,
    reference: string,
    channel: WalletTransactionChannel = 'paystack'
  ): Promise<{ success: boolean; newBalance: number }> => {
    const newBal = balance + amount;
    setBalance(newBal);

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: user?.id || 'usr_demo',
      type: 'credit',
      amount,
      description: `Wallet Top-up via ${channel === 'paystack' ? 'Paystack' : 'Transfer'}`,
      channel,
      reference,
      createdAt: new Date().toISOString(),
      status: 'successful',
    };

    setTransactions(prev => [newTx, ...prev]);

    // Send push notification & in-app alert
    await sendLocalPushNotification({
      title: 'Wallet Funded Successfully! 💳',
      body: `+$${amount.toFixed(2)} deposited into your ShopPulse Wallet via Paystack. New balance: $${newBal.toFixed(2)}.`,
      data: { type: 'wallet_funded', reference, amount, balance: newBal },
    });

    addNotification({
      title: 'Wallet Top-up Successful',
      body: `+$${amount.toFixed(2)} deposited via Paystack. Balance: $${newBal.toFixed(2)}.`,
      type: 'order',
    });

    return { success: true, newBalance: newBal };
  };

  const payWithWallet = async (
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient wallet balance. Available: $${balance.toFixed(2)}, Required: $${amount.toFixed(2)}.`,
      };
    }

    const newBal = balance - amount;
    setBalance(newBal);

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: user?.id || 'usr_demo',
      type: 'debit',
      amount,
      description: `Payment for Order #${orderId}`,
      channel: 'checkout',
      reference: `ORD_${orderId}_WALLET`,
      createdAt: new Date().toISOString(),
      status: 'successful',
    };

    setTransactions(prev => [newTx, ...prev]);

    // Send notification
    await sendLocalPushNotification({
      title: 'Wallet Payment Confirmed 🛍️',
      body: `Paid $${amount.toFixed(2)} for Order #${orderId} using your wallet. Remaining balance: $${newBal.toFixed(2)}.`,
      data: { type: 'wallet_debit', orderId, amount, balance: newBal },
    });

    addNotification({
      title: 'Wallet Payment Debited',
      body: `Paid $${amount.toFixed(2)} for Order #${orderId}. Remaining balance: $${newBal.toFixed(2)}.`,
      type: 'order',
    });

    return { success: true, newBalance: newBal };
  };

  const hasSufficientBalance = (amount: number): boolean => {
    return balance >= amount;
  };

  const refreshTransactions = () => {
    // In-memory sync
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        currency,
        transactions,
        fundWallet,
        payWithWallet,
        hasSufficientBalance,
        refreshTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
