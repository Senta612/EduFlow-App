import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

interface StudentMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  iconName: keyof typeof Feather.glyphMap;
  colorVariant?: 'primary' | 'success' | 'warning' | 'info';
  onPress?: () => void;
}

export function StudentMetricCard({
  label,
  value,
  subtitle,
  iconName,
  colorVariant = 'primary',
  onPress,
}: StudentMetricCardProps) {
  const getThemeColor = () => {
    switch (colorVariant) {
      case 'success':
        return theme.colors.state.success;
      case 'warning':
        return theme.colors.state.warning;
      case 'info':
        return theme.colors.state.info;
      case 'primary':
      default:
        return theme.colors.primary.main;
    }
  };

  const activeColor = getThemeColor();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: activeColor + '15' }]}>
          <Feather name={iconName} size={18} color={activeColor} />
        </View>
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.valueText}>{value}</Text>
        {subtitle ? (
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  bottomSection: {
    marginTop: 2,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
});
