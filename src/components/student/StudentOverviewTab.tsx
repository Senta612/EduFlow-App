import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StudentProfileData } from '@/types/teacher';
import { theme } from '@/theme';

interface StudentOverviewTabProps {
  data: StudentProfileData;
  onOpenEdit: () => void;
  onSwitchTab: (tab: 'attendance' | 'homework' | 'tests') => void;
}

export const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({
  data,
  onOpenEdit,
  onSwitchTab,
}) => {
  const { student, batch, attendance, homework, tests } = data;

  return (
    <View style={styles.tabContentSection}>
      {/* Contact & Information Card */}
      <Card variant="outlined" padding="md" style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text variant="heading" style={styles.sectionTitle}>
            Contact & Information
          </Text>
          <Pressable hitSlop={8} onPress={onOpenEdit}>
            <Text variant="label" style={styles.linkText}>
              Edit Info
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="hash" size={14} color={theme.colors.primary.main} />
            </View>
            <View style={styles.infoTexts}>
              <Text variant="caption" style={styles.infoLabel}>
                Roll Number
              </Text>
              <Text variant="label" style={styles.infoValue}>
                {student.rollNumber}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="phone" size={14} color={theme.colors.primary.main} />
            </View>
            <View style={styles.infoTexts}>
              <Text variant="caption" style={styles.infoLabel}>
                Parent / Guardian Phone
              </Text>
              <Text variant="label" style={styles.infoValue}>
                {student.parentPhone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="mail" size={14} color={theme.colors.primary.main} />
            </View>
            <View style={styles.infoTexts}>
              <Text variant="caption" style={styles.infoLabel}>
                Student Email
              </Text>
              <Text variant="label" style={styles.infoValue}>
                {student.email || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="layers" size={14} color={theme.colors.primary.main} />
            </View>
            <View style={styles.infoTexts}>
              <Text variant="caption" style={styles.infoLabel}>
                Assigned Batch
              </Text>
              <Text variant="label" style={styles.infoValue}>
                {batch.name} • {batch.grade} ({batch.subject})
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Performance Health Card */}
      <Card variant="outlined" padding="md" style={styles.sectionCard}>
        <Text variant="heading" style={styles.sectionTitle}>
          Academic & Attendance Health
        </Text>

        <View style={styles.healthItem}>
          <View style={styles.healthIconRow}>
            <View
              style={[
                styles.healthStatusDot,
                {
                  backgroundColor:
                    attendance.percentage >= 85
                      ? theme.colors.semantic.success.main
                      : attendance.percentage >= 75
                      ? theme.colors.semantic.warning.main
                      : theme.colors.semantic.danger.main,
                },
              ]}
            />
            <Text variant="label" style={styles.healthTitle}>
              Attendance Status:{' '}
              {attendance.percentage >= 85
                ? 'Healthy'
                : attendance.percentage >= 75
                ? 'Average'
                : 'Critical Warning'}
            </Text>
          </View>
          <Text variant="caption" style={styles.healthDesc}>
            {attendance.percentage >= 85
              ? `Consistently attending classes with ${attendance.presentCount} out of ${attendance.totalClasses} days present.`
              : `Missed ${attendance.absentCount} classes out of ${attendance.totalClasses}. Target is 85% attendance.`}
          </Text>
        </View>

        <View style={styles.healthDivider} />

        <View style={styles.healthItem}>
          <View style={styles.healthIconRow}>
            <View
              style={[
                styles.healthStatusDot,
                {
                  backgroundColor:
                    homework.completionPercentage >= 80
                      ? theme.colors.semantic.success.main
                      : theme.colors.semantic.warning.main,
                },
              ]}
            />
            <Text variant="label" style={styles.healthTitle}>
              Homework Submissions:{' '}
              {homework.completionPercentage >= 80 ? 'Up to date' : 'Submissions Pending'}
            </Text>
          </View>
          <Text variant="caption" style={styles.healthDesc}>
            Completed {homework.doneCount} out of {homework.totalAssigned} assignments.
          </Text>
        </View>

        <View style={styles.healthDivider} />

        <View style={styles.healthItem}>
          <View style={styles.healthIconRow}>
            <View
              style={[
                styles.healthStatusDot,
                {
                  backgroundColor:
                    tests.averagePercentage >= 75
                      ? theme.colors.semantic.success.main
                      : tests.averagePercentage >= 50
                      ? theme.colors.semantic.warning.main
                      : theme.colors.semantic.danger.main,
                },
              ]}
            />
            <Text variant="label" style={styles.healthTitle}>
              Assessment Performance: Average {tests.averagePercentage}% (Grade {tests.gradeLetter})
            </Text>
          </View>
          <Text variant="caption" style={styles.healthDesc}>
            {tests.testsAttempted > 0
              ? `Attempted ${tests.testsAttempted} tests with an average score of ${tests.averagePercentage}%.`
              : 'No test marks recorded yet.'}
          </Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContentSection: {
    gap: theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  linkText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
    fontSize: 13,
  },
  infoList: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  healthItem: {
    gap: 4,
  },
  healthIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  healthDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  healthDivider: {
    height: 1,
    backgroundColor: theme.colors.border.main,
    marginVertical: 4,
  },
});
