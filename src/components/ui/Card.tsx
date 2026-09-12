import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '@/theme';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'outlined',
  padding = 'md',
}: CardProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    padding !== 'none' && styles[`padding_${padding}` as keyof typeof styles],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  elevated: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  flat: {
    backgroundColor: '#F8FAFC',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  padding_sm: {
    padding: theme.spacing.sm,
  },
  padding_md: {
    padding: theme.spacing.md,
  },
  padding_lg: {
    padding: theme.spacing.lg,
  },
});
