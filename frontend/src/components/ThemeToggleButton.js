import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleButton() {
  const { theme, colors, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'escuro' : 'claro';

  return (
    <Pressable
      accessibilityLabel={`Mudar para o tema ${nextTheme}`}
      accessibilityRole="button"
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Text style={styles.icon}>{theme === 'light' ? '☾' : '☀'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 4,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: 48,
  },
  icon: {
    fontSize: 26,
    lineHeight: 29,
  },
});

