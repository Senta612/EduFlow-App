import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { theme } from '@/theme';

export interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'card' | 'flat' | 'inline';
  iconColor?: string;
  iconBgColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'card',
  iconColor,
  iconBgColor,
  style,
}: EmptyStateProps) {
  const isCard = variant === 'card';
  const isInline = variant === 'inline';

  return (
    <View
      style={[
        styles.container,
        isCard && styles.cardContainer,
        isInline && styles.inlineContainer,
        style,
      ]}
    >
      {/* Dual Ring Icon Badge */}
      <View
        style={[
          styles.outerRing,
          iconBgColor ? { borderColor: iconBgColor + '30' } : undefined,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            iconBgColor ? { backgroundColor: iconBgColor } : undefined,
          ]}
        >
          <Feather
            name={icon}
            size={isInline ? 22 : 28}
            color={iconColor || theme.colors.primary.main}
          />
        </View>
      </View>

      {/* Content Text Block */}
      <View style={styles.textWrap}>
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
        {description && (
          <Text variant="body" style={styles.description}>
            {description}
          </Text>
        )}
      </View>

      {/* Action Buttons Row / Column */}
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionContainer}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size={isInline ? 'sm' : 'md'}
              style={styles.mainActionBtn}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="secondary"
              size={isInline ? 'sm' : 'md'}
              style={styles.secondaryActionBtn}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  cardContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inlineContainer: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  outerRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    maxWidth: 300,
    fontSize: theme.typography.sizes.xs + 1,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
    maxWidth: 240,
    gap: 8,
  },
  mainActionBtn: {
    width: '100%',
  },
  secondaryActionBtn: {
    width: '100%',
  },
});
