import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StudentProfileData } from '@/types/teacher';
import { theme } from '@/theme';

interface StudentMetricsGridProps {
  attendance: StudentProfileData['attendance'];
  homework: StudentProfileData['homework'];
  tests: StudentProfileData['tests'];
}

export const StudentMetricsGrid: React.FC<StudentMetricsGridProps> = ({
  attendance,
  homework,
  tests,
}) => {
  return (
    <View style={styles.metricsGrid}>
      <Card variant="outlined" padding="sm" style={styles.metricTile}>
        <Text variant="caption" style={styles.metricLabel}>
          Attendance
        </Text>
        <Text
          variant="heading"
          style={[
            styles.metricValue,
            {
              color:
                attendance.percentage >= 85
                  ? theme.colors.semantic.success.main
                  : attendance.percentage >= 75
                  ? theme.colors.semantic.warning.main
                  : theme.colors.semantic.danger.main,
            },
          ]}
        >
          {attendance.percentage}%
        </Text>
        <Text variant="caption" style={styles.metricSub}>
          {attendance.presentCount}/{attendance.totalClasses} Days
        </Text>
      </Card>

      <Card variant="outlined" padding="sm" style={styles.metricTile}>
        <Text variant="caption" style={styles.metricLabel}>
          Homework
        </Text>
        <Text variant="heading" style={[styles.metricValue, { color: theme.colors.primary.main }]}>
          {homework.completionPercentage}%
        </Text>
        <Text variant="caption" style={styles.metricSub}>
          {homework.doneCount}/{homework.totalAssigned} Done
        </Text>
      </Card>

      <Card variant="outlined" padding="sm" style={styles.metricTile}>
        <Text variant="caption" style={styles.metricLabel}>
          Test Average
        </Text>
        <Text variant="heading" style={[styles.metricValue, { color: '#8B5CF6' }]}>
          {tests.testsAttempted > 0 ? `${tests.averagePercentage}%` : '—'}
        </Text>
        <Text variant="caption" style={styles.metricSub}>
          Grade {tests.gradeLetter}
        </Text>
      </Card>

      <Card variant="outlined" padding="sm" style={styles.metricTile}>
        <Text variant="caption" style={styles.metricLabel}>
          Tests Done
        </Text>
        <Text variant="heading" style={[styles.metricValue, { color: theme.colors.text.primary }]}>
          {tests.testsAttempted}/{tests.totalTests}
        </Text>
        <Text variant="caption" style={styles.metricSub}>
          Assessments
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 9,
    color: theme.colors.text.disabled,
  },
});
