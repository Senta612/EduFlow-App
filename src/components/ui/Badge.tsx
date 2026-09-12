import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { theme } from '@/theme';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Feather.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
}: BadgeProps) {
  const badgeStyle = [
    styles.base,
    styles[variant],
    size === 'sm' && styles.sizeSm,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    size === 'sm' && styles.textSm,
  ];

  const iconColor = (
    styles[`${variant}Text` as keyof typeof styles] as TextStyle
  )?.color ?? theme.colors.text.secondary;

  return (
    <View style={badgeStyle}>
      {icon && (
        <Feather
          name={icon}
          size={size === 'sm' ? 10 : 12}
          color={iconColor as string}
          style={styles.icon}
        />
      )}
      <Text variant="caption" style={textStyle}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.full ?? 9999,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: theme.typography.weights.medium,
    fontSize: theme.typography.sizes.xs,
  },
  textSm: {
    fontSize: 10,
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary.bg,
  },
  primaryText: {
    color: theme.colors.primary.main,
  },

  success: {
    backgroundColor: theme.colors.semantic.success.bg,
  },
  successText: {
    color: theme.colors.semantic.success.main,
  },

  danger: {
    backgroundColor: theme.colors.semantic.danger.bg,
  },
  dangerText: {
    color: theme.colors.semantic.danger.main,
  },

  warning: {
    backgroundColor: theme.colors.semantic.warning.bg,
  },
  warningText: {
    color: theme.colors.semantic.warning.main,
  },

  info: {
    backgroundColor: theme.colors.semantic.info.bg,
  },
  infoText: {
    color: theme.colors.semantic.info.main,
  },

  neutral: {
    backgroundColor: '#F1F5F9',
  },
  neutralText: {
    color: theme.colors.text.secondary,
  },
});
