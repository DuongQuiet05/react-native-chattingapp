import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, variant = 'default', padding = 'md', style, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getPadding = () => {
    switch (padding) {
      case 'sm':
        return 12;
      case 'md':
        return 16;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === 'outlined' ? 'transparent' : colors.card,
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: colors.border,
          padding: getPadding(),
        },
        Shadows.md,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
  },
});

