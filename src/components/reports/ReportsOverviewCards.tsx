import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

interface ReportsOverviewCardsProps {
  totalStudents: number;
  averageAttendance: number;
  defaultersCount: number;
  hwCompletionRate: number;
  totalTests: number;
  onPressStudents: () => void;
  onPressDefaulters?: () => void;
}

export function ReportsOverviewCards({
  totalStudents,
  averageAttendance,
  defaultersCount,
  hwCompletionRate,
  totalTests,
  onPressStudents,
  onPressDefaulters,
}: ReportsOverviewCardsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Top 2 Major Cards */}
      <View style={styles.row}>
        {/* Total Students */}
        <Pressable
          style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
          onPress={onPressStudents}
          accessibilityRole="button"
          accessibilityLabel="View enrolled students directory"
        >
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primary.bg }]}>
                <Feather name="users" size={18} color={theme.colors.primary.main} />
              </View>
              <View style={styles.badgeHint}>
                <Text variant="caption" style={styles.badgeHintText}>
                  {t('reports.directory')}
                </Text>
                <Feather name="arrow-right" size={11} color={theme.colors.primary.main} />
              </View>
            </View>
            <Text variant="title" style={styles.metricValue}>
              {totalStudents}
            </Text>
            <Text variant="caption" style={styles.metricLabel}>
              {t('reports.enrolledStudents')}
            </Text>
          </Card>
        </Pressable>

        {/* At-Risk / Defaulters Alert */}
        <Pressable
          style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
          onPress={onPressDefaulters}
          accessibilityRole="button"
          accessibilityLabel="View at-risk students"
        >
          <Card
            variant="elevated"
            padding="md"
            style={[
              styles.card,
              defaultersCount > 0 && {
                borderColor: theme.colors.semantic.warning.main,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      defaultersCount > 0
                        ? theme.colors.semantic.warning.bg
                        : theme.colors.semantic.success.bg,
                  },
                ]}
              >
                <Feather
                  name={defaultersCount > 0 ? 'alert-triangle' : 'check-circle'}
                  size={18}
                  color={
                    defaultersCount > 0
                      ? theme.colors.semantic.warning.main
                      : theme.colors.semantic.success.main
                  }
                />
              </View>
              {defaultersCount > 0 && (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: theme.colors.semantic.warning.bg },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: theme.colors.semantic.warning.main,
                      fontWeight: '700',
                      fontSize: 10,
                    }}
                  >
                    {t('reports.actionNeeded')}
                  </Text>
                </View>
              )}
            </View>
            <Text
              variant="title"
              style={[
                styles.metricValue,
                defaultersCount > 0 && { color: theme.colors.semantic.warning.main },
              ]}
            >
              {defaultersCount}
            </Text>
            <Text variant="caption" style={styles.metricLabel}>
              {t('reports.needsAttention')}
            </Text>
          </Card>
        </Pressable>
      </View>

      {/* Bottom 2 Performance Cards */}
      <View style={styles.row}>
        {/* Avg Attendance */}
        <View style={styles.cardWrapper}>
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.colors.semantic.success.bg },
                ]}
              >
                <Feather
                  name="calendar"
                  size={18}
                  color={theme.colors.semantic.success.main}
                />
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: theme.colors.semantic.success.bg },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: theme.colors.semantic.success.main,
                    fontWeight: '700',
                    fontSize: 10,
                  }}
                >
                  {t('reports.overall')}
                </Text>
              </View>
            </View>
            <Text variant="title" style={styles.metricValue}>
              {averageAttendance}%
            </Text>
            <Text variant="caption" style={styles.metricLabel}>
              {t('reports.avgAttendanceRate')}
            </Text>
          </Card>
        </View>

        {/* Homework & Tests */}
        <View style={styles.cardWrapper}>
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[styles.iconBox, { backgroundColor: theme.colors.semantic.info.bg }]}
              >
                <Feather name="book-open" size={18} color={theme.colors.semantic.info.main} />
              </View>
              <View
                style={[styles.statusPill, { backgroundColor: theme.colors.semantic.info.bg }]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: theme.colors.semantic.info.main,
                    fontWeight: '700',
                    fontSize: 10,
                  }}
                >
                  {t('reports.testsCount', { count: totalTests })}
                </Text>
              </View>
            </View>
            <Text variant="title" style={styles.metricValue}>
              {hwCompletionRate}%
            </Text>
            <Text variant="caption" style={styles.metricLabel}>
              {t('reports.hwCompletionRate')}
            </Text>
          </Card>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cardWrapper: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  badgeHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});
