import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { LocationProvider } from '@/src/context/LocationContext';
import { WalletProvider } from '@/src/context/WalletContext';
import { Colors } from '@/src/constants/theme';
import { SplashScreenView } from '@/src/components/SplashScreenView';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <NotificationProvider>
            <WalletProvider>
              <CartProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerTintColor: Colors.light.text,
                    headerTitleStyle: { fontWeight: '700' },
                    contentStyle: { backgroundColor: Colors.light.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="login"
                    options={{
                      headerShown: false,
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="product/[id]"
                    options={{
                      title: 'Product Details',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen
                    name="checkout/index"
                    options={{
                      title: 'Checkout',
                      headerBackTitle: 'Cart',
                    }}
                  />
                  <Stack.Screen
                    name="splash"
                    options={{
                      headerShown: false,
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="checkout/success"
                    options={{
                      headerShown: false,
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen
                    name="wallet"
                    options={{
                      title: 'My Digital Wallet',
                      headerBackTitle: 'Account',
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      title: 'Settings & Security',
                      headerBackTitle: 'Account',
                    }}
                  />
                  <Stack.Screen
                    name="customer-care"
                    options={{
                      title: 'Customer Care & FAQs',
                      headerBackTitle: 'Account',
                    }}
                  />
                  <Stack.Screen
                    name="notifications"
                    options={{
                      title: 'Notifications',
                      headerBackTitle: 'Home',
                    }}
                  />
                  <Stack.Screen
                    name="notifications-settings"
                    options={{
                      title: 'Notification Preferences',
                      headerBackTitle: 'Back',
                    }}
                  />
                </Stack>
              </CartProvider>
            </WalletProvider>
          </NotificationProvider>
        </LocationProvider>
      </AuthProvider>
      {showSplash && <SplashScreenView onFinish={() => setShowSplash(false)} />}
    </View>
  );
}
