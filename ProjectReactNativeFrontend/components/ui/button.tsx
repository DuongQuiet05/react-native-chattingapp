import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 };
      default:
        return {};
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        { width: fullWidth ? '100%' : 'auto' },
        disabled && { opacity: 0.5 },
        style,
      ]}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.text : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyles.fontSize,
              color: variant === 'outline' ? colors.text : '#FFFFFF',
            },
          ]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});

