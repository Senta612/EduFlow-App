import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { Badge } from './Badge';
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

export interface BatchCardProps {
  batch: Batch;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BatchCard({ batch, onPress, style }: BatchCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open batch ${batch.subject} ${batch.grade}`}
    >
      {/* Top Row: Batch Name, Grade, Subject & Student Count */}
      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <Text variant="heading" style={styles.batchNameText}>
            {batch.name}
          </Text>
          <Text variant="body" style={styles.gradeSubjectText}>
            {batch.grade} • {batch.subject}
          </Text>
        </View>
        <Badge
          label={`${batch.studentCount} Students`}
          variant="primary"
          icon="users"
          size="sm"
        />
      </View>

      {/* Schedule & Timing Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoItem}>
          <Feather
            name="calendar"
            size={13}
            color={theme.colors.text.secondary}
          />
          <Text variant="caption" style={styles.infoText}>
            {batch.schedule}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Feather
            name="clock"
            size={13}
            color={theme.colors.text.secondary}
          />
          <Text variant="caption" style={styles.infoText}>
            {batch.timing}
          </Text>
        </View>

        {batch.room && (
          <View style={styles.infoItem}>
            <Feather
              name="map-pin"
              size={13}
              color={theme.colors.text.secondary}
            />
            <Text variant="caption" style={styles.infoText}>
              {batch.room}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: Action hint */}
      <View style={styles.footerRow}>
        {batch.attendanceTakenToday ? (
          <Badge
            label="✓ Attendance Completed"
            variant="success"
            size="sm"
          />
        ) : (
          <Badge
            label="Attendance Pending"
            variant="warning"
            size="sm"
          />
        )}
        <View style={styles.openHint}>
          <Text variant="label" style={styles.openText}>
            Open
          </Text>
          <Feather
            name="arrow-right"
            size={15}
            color={theme.colors.primary.main}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: theme.spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
    borderColor: theme.colors.primary.light,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.sm,
  },
  batchNameText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  gradeSubjectText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  openHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
});
