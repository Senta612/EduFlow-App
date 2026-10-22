import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { FeeStatus } from '@/types/teacher';
import { theme } from '@/theme';

interface FeeStatusSelectorProps {
  value: FeeStatus;
  onChange: (status: FeeStatus) => void;
  label?: string;
  disabled?: boolean;
}

interface StatusOption {
  status: FeeStatus;
  label: string;
  sublabel: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
  border: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: 'paid',
    label: 'Paid',
    sublabel: 'Fees fully cleared',
    icon: 'check-circle',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#86EFAC',
  },
  {
    status: 'pending',
    label: 'Pending',
    sublabel: 'Payment due/awaited',
    icon: 'clock',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FCD34D',
  },
  {
    status: 'overdue',
    label: 'Overdue',
    sublabel: 'Payment delayed',
    icon: 'alert-circle',
    color: '#B91C1C',
    bg: '#FEE2E2',
    border: '#FCA5A5',
  },
  {
    status: 'free',
    label: 'Free',
    sublabel: 'Free seat / concession',
    icon: 'award',
    color: '#6D28D9',
    bg: '#EDE9FE',
    border: '#C4B5FD',
  },
];

export const FeeStatusSelector: React.FC<FeeStatusSelectorProps> = ({
  value,
  onChange,
  label = 'Fee / Concession Status',
  disabled = false,
}) => {
  const selectedConfig = STATUS_OPTIONS.find((opt) => opt.status === value) || STATUS_OPTIONS[1];

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant="caption" style={styles.sectionLabel}>
          {label}
        </Text>
        <View style={[styles.activeIndicatorPill, { backgroundColor: selectedConfig.bg }]}>
          <Feather name={selectedConfig.icon} size={11} color={selectedConfig.color} />
          <Text variant="caption" style={[styles.activeIndicatorText, { color: selectedConfig.color }]}>
            {selectedConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.optionsRow}>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = value === opt.status;
          return (
            <Pressable
              key={opt.status}
              style={[
                styles.optionChip,
                isSelected && {
                  backgroundColor: opt.bg,
                  borderColor: opt.border,
                },
              ]}
              onPress={() => !disabled && onChange(opt.status)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label} fee status`}
            >
              <Feather
                name={opt.icon}
                size={14}
                color={isSelected ? opt.color : theme.colors.text.secondary}
              />
              <Text
                variant="caption"
                style={[
                  styles.optionText,
                  isSelected && {
                    color: opt.color,
                    fontWeight: '700',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" style={styles.descriptionText}>
        {selectedConfig.sublabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  activeIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  activeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  optionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: theme.colors.background.paper,
    gap: 5,
  },
  optionText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
});
