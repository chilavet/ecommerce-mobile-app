import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SplashScreenView } from '@/src/components/SplashScreenView';

export default function SplashScreenRoute() {
  return (
    <View style={{ flex: 1 }}>
      <SplashScreenView
        duration={5000}
        onFinish={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
      />
    </View>
  );
}

