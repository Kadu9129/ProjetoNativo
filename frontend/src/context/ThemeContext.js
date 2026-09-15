import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const THEME_STORAGE_KEY = 'theme';

export const palettes = {
  light: {
    background: '#f5f7fa',
    surface: '#ffffff',
    surfaceMuted: '#eef2f6',
    text: '#12213a',
    textMuted: '#5c6b7f',
    primary: '#ef5b52',
    primaryPressed: '#d94740',
    onPrimary: '#ffffff',
    border: '#d8e0e8',
    danger: '#b42318',
    warning: '#9a6700',
    info: '#2676ff',
    shadow: '#12213a',
    mapOverlay: 'transparent',
  },
  dark: {
    background: '#07122b',
    surface: '#111e38',
    surfaceMuted: '#1b2a45',
    text: '#f5f8ff',
    textMuted: '#b4c0d3',
    primary: '#ff675f',
    primaryPressed: '#e95049',
    onPrimary: '#ffffff',
    border: '#2d3b56',
    danger: '#ff9b94',
    warning: '#ffd166',
    info: '#79a8ff',
    shadow: '#000000',
    mapOverlay: 'rgba(3, 13, 35, 0.28)',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedTheme) => {
        if (active && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, colors: palettes[theme], toggleTheme }),
    [theme, toggleTheme],
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={palettes.light.primary} />
      </View>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: palettes.light.background,
    flex: 1,
    justifyContent: 'center',
  },
});

