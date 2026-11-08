import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface SplashScreenViewProps {
  onFinish: () => void;
  duration?: number;
}

const { width, height } = Dimensions.get('window');

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({
  onFinish,
  duration = 2200,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation (scale up + fade in)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Text fade-in after icon settles
    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 600,
      delay: 350,
      useNativeDriver: true,
    }).start();

    // 3. Subtle pulsing heartbeat on badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 4. Exit transition timer
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        pulseLoop.stop();
        onFinish();
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  const handleSkip = () => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar style="light" />

      {/* Background Decor Circles */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <TouchableOpacity
        activeOpacity={1}
        onPress={handleSkip}
        style={styles.content}
      >
        {/* Animated App Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.iconBox}>
            <Ionicons name="cart" size={54} color="#FFFFFF" />
            <View style={styles.badgePulse}>
              <Ionicons name="flash" size={14} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        {/* Brand Name & Tagline */}
        <Animated.View style={[styles.brandSection, { opacity: textOpacityAnim }]}>
          <View style={styles.titleRow}>
            <Text style={styles.titleShop}>Shop</Text>
            <Text style={styles.titlePulse}>Pulse</Text>
          </View>

          {/* Nigeria Badge */}
          <View style={styles.countryBadge}>
            <Text style={styles.countryFlag}>🇳🇬</Text>
            <Text style={styles.countryText}>Nigeria's E-Commerce Hub</Text>
          </View>

          <Text style={styles.tagline}>
            Shop Quality • Fast Delivery • Secure Payments
          </Text>
        </Animated.View>

        {/* Loading Indicator Dots */}
        <Animated.View style={[styles.loadingSection, { opacity: textOpacityAnim }]}>
          <View style={styles.loadingBarWrapper}>
            <View style={styles.loadingBarFill} />
          </View>
          <Text style={styles.loadingText}>Loading your marketplace...</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A', // Sleek dark slate
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircleTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.15)', // Subtle primary glow
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.12)', // Subtle emerald glow
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconBox: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  badgePulse: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981', // Emerald accent
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleShop: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titlePulse: {
    fontSize: 38,
    fontWeight: '800',
    color: '#38BDF8', // Sky blue accent
    letterSpacing: -0.5,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    marginTop: 12,
    gap: 6,
  },
  countryFlag: {
    fontSize: 14,
  },
  countryText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  loadingSection: {
    marginTop: 48,
    alignItems: 'center',
    width: 180,
  },
  loadingBarWrapper: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
});
