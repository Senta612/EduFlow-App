import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Badge, BadgeVariant } from './Badge';
import { FeeStatus } from '@/types/teacher';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

interface FeeStatusBadgeProps {
  status?: FeeStatus | null;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function FeeStatusBadge({
  status = 'pending',
  size = 'sm',
  style,
}: FeeStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusConfig = (
    currentStatus?: FeeStatus | null,
  ): {
    label: string;
    variant: BadgeVariant;
    icon: keyof typeof Feather.glyphMap;
  } => {
    switch (currentStatus) {
      case 'paid':
        return {
          label: t('common.paid') || 'Paid',
          variant: 'success',
          icon: 'check-circle',
        };
      case 'free':
        return {
          label: t('common.free') || 'Free',
          variant: 'purple',
          icon: 'award',
        };
      case 'overdue':
        return {
          label: t('common.overdue') || 'Overdue',
          variant: 'danger',
          icon: 'alert-circle',
        };
      case 'pending':
      default:
        return {
          label: t('common.pending') || 'Pending',
          variant: 'warning',
          icon: 'clock',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      label={config.label}
      variant={config.variant}
      icon={config.icon}
      size={size}
      style={style}
    />
  );
}
