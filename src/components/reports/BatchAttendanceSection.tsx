import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BatchAnalyticsSummary } from '@/types/teacher';
import { theme } from '@/theme';

interface BatchAttendanceSectionProps {
  batchSummaries: BatchAnalyticsSummary[];
  onOpenBatch: (batchId: string) => void;
}

export function BatchAttendanceSection({
  batchSummaries,
  onOpenBatch,
}: BatchAttendanceSectionProps) {
  if (batchSummaries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerIconBox}>
            <Feather name="bar-chart-2" size={16} color={theme.colors.semantic.success.main} />
          </View>
          <Text variant="heading" style={styles.title}>
            Batch Attendance & Activity
          </Text>
        </View>
        <Text variant="caption" style={styles.subtitle}>
          Calculated attendance rates & assignment status per batch
        </Text>
      </View>

      <View style={styles.list}>
        {batchSummaries.map((item) => {
          const { batch, totalStudents, attendancePercentage, attendanceStatus, totalClasses, hwCompletionPercentage } = item;

          const badgeVariant =
            attendanceStatus === 'excellent'
              ? 'success'
              : attendanceStatus === 'good'
              ? 'info'
              : 'danger';

          const progressColor =
            attendanceStatus === 'excellent'
              ? theme.colors.semantic.success.main
              : attendanceStatus === 'good'
              ? theme.colors.primary.main
              : theme.colors.semantic.danger.main;

          return (
            <Card key={batch.id} variant="elevated" padding="md" style={styles.batchCard}>
              <Pressable
                style={({ pressed }) => [
                  styles.cardPressable,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => onOpenBatch(batch.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" style={styles.batchName}>
                      {batch.name}
                    </Text>
                    <Text variant="caption" style={styles.batchMeta}>
                      {batch.grade} • {batch.subject} • {totalStudents} Students
                    </Text>
                  </View>
                  <Badge
                    label={`${attendancePercentage}% Rate`}
                    variant={badgeVariant}
                    size="sm"
                  />
                </View>

                {/* Visual Progress Fill */}
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(0, attendancePercentage))}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                {/* Sub info footer */}
                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <Feather name="calendar" size={12} color={theme.colors.text.secondary} />
                    <Text variant="caption" style={styles.footerText}>
                      {totalClasses} {totalClasses === 1 ? 'class' : 'classes'} recorded
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Feather name="book-open" size={12} color={theme.colors.text.secondary} />
                    <Text variant="caption" style={styles.footerText}>
                      {hwCompletionPercentage}% HW done
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={theme.colors.primary.main} />
                </View>
              </Pressable>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.semantic.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  list: {
    gap: theme.spacing.sm,
  },
  batchCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressable: {
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  batchMeta: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background.screen,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: theme.colors.border.main,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});
