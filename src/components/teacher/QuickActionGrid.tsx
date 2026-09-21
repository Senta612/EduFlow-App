import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

interface QuickActionGridProps {
  onPressAttendance: () => void;
  onPressHomework: () => void;
  onPressMarks: () => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onPressAttendance,
  onPressHomework,
  onPressMarks,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('dashboard.quickActions')}
      </Text>
      <View style={styles.quickActionsGrid}>
        <Pressable style={styles.quickActionCard} onPress={onPressAttendance}>
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: theme.colors.primary.bg },
            ]}
          >
            <Feather
              name="check-square"
              size={22}
              color={theme.colors.primary.main}
            />
          </View>
          <Text variant="label" style={styles.quickActionLabel}>
            {t('common.attendance')}
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            {t('attendance.markAttendance')}
          </Text>
        </Pressable>

        <Pressable style={styles.quickActionCard} onPress={onPressHomework}>
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: theme.colors.semantic.info.bg },
            ]}
          >
            <Feather
              name="book-open"
              size={22}
              color={theme.colors.semantic.info.main}
            />
          </View>
          <Text variant="label" style={styles.quickActionLabel}>
            {t('common.homework')}
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            {t('homework.createHomework')}
          </Text>
        </Pressable>

        <Pressable style={styles.quickActionCard} onPress={onPressMarks}>
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: theme.colors.semantic.warning.bg },
            ]}
          >
            <Feather
              name="award"
              size={22}
              color={theme.colors.semantic.warning.main}
            />
          </View>
          <Text variant="label" style={styles.quickActionLabel}>
            {t('common.marks')}
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            {t('tests.enterMarks')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    gap: 4,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  quickActionSub: {
    color: theme.colors.text.disabled,
    textAlign: 'center',
    fontSize: 10,
  },
});
