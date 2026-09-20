import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
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
  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        Quick Actions
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
            Attendance
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            Mark daily presence
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
            Homework
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            Publish assignment
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
            Marks
          </Text>
          <Text variant="caption" style={styles.quickActionSub}>
            Record test scores
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
