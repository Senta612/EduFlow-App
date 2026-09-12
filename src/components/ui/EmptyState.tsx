import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Feather name={icon} size={36} color={theme.colors.primary.main} />
      </View>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button title={actionLabel} onPress={onAction} />
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  description: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    maxWidth: 280,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
    maxWidth: 220,
  },
});
