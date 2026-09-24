import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { StudentAttendanceOverview } from '@/types/student';
import { theme } from '@/theme';

interface AttendanceMonthlyCalendarProps {
  data: StudentAttendanceOverview;
}

export function AttendanceMonthlyCalendar({ data }: AttendanceMonthlyCalendarProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Attendance Summary</Text>
          <Text style={styles.subtitle}>Current Academic Term</Text>
        </View>

        <View style={styles.percentageBadge}>
          <Text style={styles.percentageNumber}>{data.overallPercentage}%</Text>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.state.success }]} />
          <Text style={styles.summaryLabel}>Present: </Text>
          <Text style={styles.summaryValue}>{data.presentCount} days</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.state.danger }]} />
          <Text style={styles.summaryLabel}>Absent: </Text>
          <Text style={styles.summaryValue}>{data.absentCount} days</Text>
        </View>

        <View style={styles.summaryItem}>
          <Feather name="zap" size={13} color={theme.colors.state.warning} />
          <Text style={styles.summaryLabel}>Streak: </Text>
          <Text style={styles.summaryValue}>{data.streakDays}d</Text>
        </View>
      </View>

      <View style={styles.logSection}>
        <Text style={styles.logTitle}>Recent Class Log</Text>
        <View style={styles.daysList}>
          {data.currentMonthDays.map((item, index) => {
            const isPresent = item.status === 'present';
            return (
              <View key={`${item.date}-${index}`} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isPresent
                          ? theme.colors.state.success
                          : theme.colors.state.danger,
                      },
                    ]}
                  />
                  <Text style={styles.dayDate}>{item.date}</Text>
                  <Text style={styles.dayName}>({item.dayName})</Text>
                </View>

                <View style={styles.batchInfo}>
                  <Text style={styles.batchNameText}>{item.batchName}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isPresent
                        ? theme.colors.state.success + '15'
                        : theme.colors.state.danger + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isPresent
                          ? theme.colors.state.success
                          : theme.colors.state.danger,
                      },
                    ]}
                  >
                    {isPresent ? 'Present' : 'Absent'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  percentageBadge: {
    backgroundColor: theme.colors.primary.main + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  percentageNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  logSection: {
    marginTop: theme.spacing.xs,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  daysList: {
    gap: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 110,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  dayName: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  batchInfo: {
    flex: 1,
    paddingHorizontal: 6,
  },
  batchNameText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
