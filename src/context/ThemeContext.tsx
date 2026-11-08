import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme as useNativeColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  surface: string;
  inputBg: string;
  inputBorder: string;
  badge: string;
  cardBorder: string;
  subCard: string;
  iconBg: string;
  divider: string;
  modalBg: string;
  // Shared brand colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  danger: string;
  dangerLight: string;
  success: string;
  warning: string;
}

export interface ThemeContextType {
  themeMode: ThemeMode; // 'system' | 'light' | 'dark'
  isDark: boolean;
  colors: ThemeColors;
  systemColorScheme: 'light' | 'dark';
  followSystem: boolean; // true if themeMode === 'system'
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setFollowSystem: (follow: boolean) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@shoppulse_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nativeScheme = useNativeColorScheme();
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    nativeScheme === 'dark' ? 'dark' : 'light'
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync with device appearance changes in real time
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    const current = Appearance.getColorScheme();
    if (current) {
      setSystemScheme(current === 'dark' ? 'dark' : 'light');
    }

    return () => {
      subscription.remove();
    };
  }, []);

  // Load saved theme preference on mount
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.error('Failed to load theme preference:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadThemePreference();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };

  const setFollowSystem = async (follow: boolean) => {
    if (follow) {
      await setThemeMode('system');
    } else {
      // Lock into current effective appearance
      const effectiveDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
      await setThemeMode(effectiveDark ? 'dark' : 'light');
    }
  };

  const toggleTheme = async () => {
    const effectiveDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
    await setThemeMode(effectiveDark ? 'light' : 'dark');
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const followSystem = themeMode === 'system';

  const colors: ThemeColors = useMemo(() => {
    const palette = isDark ? Colors.dark : Colors.light;
    return {
      background: palette.background,
      card: palette.card,
      cardSecondary: isDark ? '#1E293B' : '#F1F5F9',
      text: palette.text,
      textSecondary: palette.textSecondary,
      textMuted: palette.textMuted,
      border: palette.border,
      borderLight: palette.borderLight,
      surface: palette.surface,
      inputBg: palette.inputBg,
      inputBorder: isDark ? '#334155' : '#E2E8F0',
      badge: palette.badge,
      cardBorder: isDark ? '#26334D' : '#E2E8F0',
      subCard: isDark ? '#0F172A' : '#F8FAFC',
      iconBg: isDark ? '#1E293B' : '#EFF6FF',
      divider: isDark ? '#1E293B' : '#F1F5F9',
      modalBg: isDark ? '#161F30' : '#FFFFFF',
      // Shared accents
      primary: Colors.primary,
      primaryDark: Colors.primaryDark,
      primaryLight: isDark ? '#1E3A8A' : Colors.primaryLight,
      secondary: Colors.secondary,
      accent: Colors.accent,
      danger: Colors.danger,
      dangerLight: isDark ? '#7F1D1D' : Colors.dangerLight,
      success: Colors.success,
      warning: Colors.warning,
    };
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors,
      systemColorScheme: systemScheme,
      followSystem,
      setThemeMode,
      setFollowSystem,
      toggleTheme,
    }),
    [themeMode, isDark, colors, systemScheme, followSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
