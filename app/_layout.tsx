import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { Colors } from '@/src/constants/theme';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
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
            name="checkout/success"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings & Security',
              headerBackTitle: 'Account',
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
