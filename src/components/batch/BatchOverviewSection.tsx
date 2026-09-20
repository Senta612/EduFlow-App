import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Batch, Student, Homework, Test } from '@/types/teacher';
import { theme } from '@/theme';

interface BatchOverviewSectionProps {
  batch: Batch;
  students: Student[];
  homeworkList: Homework[];
  testsList: Test[];
  onSwitchTab: (tab: 'students' | 'attendance' | 'homework' | 'tests') => void;
  onTakeAttendance: () => void;
}

export const BatchOverviewSection: React.FC<BatchOverviewSectionProps> = ({
  batch,
  students,
  homeworkList,
  testsList,
  onSwitchTab,
  onTakeAttendance,
}) => {
  const isAttendanceDone = Boolean(batch.attendanceTakenToday);

  return (
    <View style={styles.sectionStack}>
      {/* Today Status Card - 100% Responsive & Non-clipping */}
      <Card
        variant="elevated"
        padding="md"
        style={[
          styles.todayCard,
          isAttendanceDone ? styles.todayCardCompleted : styles.todayCardPending,
        ]}
      >
        <View style={styles.todayHeaderRow}>
          <View style={styles.todayHeaderLeft}>
            <View
              style={[
                styles.todayIconCircle,
                {
                  backgroundColor: isAttendanceDone
                    ? theme.colors.semantic.success.bg
                    : theme.colors.semantic.warning.bg,
                },
              ]}
            >
              <Feather
                name={isAttendanceDone ? 'check-circle' : 'clock'}
                size={18}
                color={
                  isAttendanceDone
                    ? theme.colors.semantic.success.main
                    : theme.colors.semantic.warning.main
                }
              />
            </View>
            <View style={styles.todayTitleTexts}>
              <Text variant="label" style={styles.todayCardTitle}>
                Today's Attendance
              </Text>
              <Text variant="caption" style={styles.todayCardSubtitle}>
                {isAttendanceDone
                  ? 'Attendance is marked for today'
                  : 'Daily roll call pending'}
              </Text>
            </View>
          </View>

          <Badge
            label={isAttendanceDone ? 'Completed' : 'Pending'}
            variant={isAttendanceDone ? 'success' : 'warning'}
            icon={isAttendanceDone ? 'check' : 'alert-circle'}
            size="sm"
          />
        </View>

        <View style={styles.todayActionRow}>
          <Button
            title={isAttendanceDone ? 'View & Update Attendance' : 'Mark Attendance Now'}
            icon={isAttendanceDone ? 'edit-2' : 'check-square'}
            variant={isAttendanceDone ? 'outline' : 'primary'}
            fullWidth
            onPress={onTakeAttendance}
          />
        </View>
      </Card>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <Pressable
          style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
          onPress={() => onSwitchTab('students')}
          accessibilityRole="button"
          accessibilityLabel="View students list"
        >
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: theme.colors.primary.bg }]}>
              <Feather name="users" size={16} color={theme.colors.primary.main} />
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
              Total Students
            </Text>
            <Text variant="title" style={styles.statNumber}>
              {students.length}
            </Text>
            <View style={styles.statArrowRow}>
              <Text variant="caption" style={styles.statActionHint}>
                View Roster
              </Text>
              <Feather name="chevron-right" size={12} color={theme.colors.primary.main} />
            </View>
          </Card>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
          onPress={() => onSwitchTab('homework')}
          accessibilityRole="button"
          accessibilityLabel="View homework assignments"
        >
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="book-open" size={16} color="#0284C7" />
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
              Homework
            </Text>
            <Text variant="title" style={[styles.statNumber, { color: '#0284C7' }]}>
              {homeworkList.length}
            </Text>
            <View style={styles.statArrowRow}>
              <Text variant="caption" style={[styles.statActionHint, { color: '#0284C7' }]}>
                View All
              </Text>
              <Feather name="chevron-right" size={12} color="#0284C7" />
            </View>
          </Card>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
          onPress={() => onSwitchTab('tests')}
          accessibilityRole="button"
          accessibilityLabel="View tests and marks"
        >
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="award" size={16} color="#8B5CF6" />
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
              Tests Done
            </Text>
            <Text variant="title" style={[styles.statNumber, { color: '#8B5CF6' }]}>
              {testsList.length}
            </Text>
            <View style={styles.statArrowRow}>
              <Text variant="caption" style={[styles.statActionHint, { color: '#8B5CF6' }]}>
                View Marks
              </Text>
              <Feather name="chevron-right" size={12} color="#8B5CF6" />
            </View>
          </Card>
        </Pressable>
      </View>

      {/* Recent Homework Preview */}
      <View style={styles.sectionBlock}>
        <View style={styles.blockHeader}>
          <Text variant="heading" style={styles.blockTitle}>
            Active Homework
          </Text>
          <Pressable onPress={() => onSwitchTab('homework')}>
            <Text variant="label" style={styles.linkText}>
              See all
            </Text>
          </Pressable>
        </View>
        {homeworkList.length === 0 ? (
          <Text variant="caption" style={styles.emptyInlineText}>
            No active homework assigned for this batch.
          </Text>
        ) : (
          homeworkList.slice(0, 2).map((hw) => (
            <Card key={hw.id} variant="outlined" padding="md" style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text variant="label" style={styles.itemTitle}>
                  {hw.title}
                </Text>
                <Badge label={`Due ${hw.dueDate}`} variant="info" size="sm" />
              </View>
              {hw.description ? (
                <Text variant="caption" numberOfLines={2} style={styles.itemDesc}>
                  {hw.description}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: theme.spacing.lg,
  },
  todayCard: {
    gap: 14,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  todayCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.semantic.success.main,
  },
  todayCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.semantic.warning.main,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  todayHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayTitleTexts: {
    flex: 1,
    gap: 2,
  },
  todayCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  todayCardSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  todayActionRow: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  statNumber: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  statArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statActionHint: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  emptyInlineText: {
    color: theme.colors.text.secondary,
    paddingVertical: theme.spacing.md,
  },
  itemCard: {
    gap: theme.spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  itemDesc: {
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
