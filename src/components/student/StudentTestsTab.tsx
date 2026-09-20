import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentProfileData } from '@/types/teacher';
import { theme } from '@/theme';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

interface StudentTestsTabProps {
  tests: StudentProfileData['tests'];
}

export const StudentTestsTab: React.FC<StudentTestsTabProps> = ({ tests }) => {
  return (
    <View style={styles.tabContentSection}>
      {/* Test Average Summary Banner */}
      <Card variant="outlined" padding="md" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Tests Taken
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.text.primary }]}>
              {tests.testsAttempted}/{tests.totalTests}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Average Score
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: '#8B5CF6' }]}>
              {tests.averagePercentage}%
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Overall Grade
            </Text>
            <Text
              variant="heading"
              style={[
                styles.summaryNum,
                {
                  color:
                    tests.gradeLetter === 'A+' || tests.gradeLetter === 'A'
                      ? theme.colors.semantic.success.main
                      : tests.gradeLetter === 'B'
                      ? theme.colors.primary.main
                      : theme.colors.semantic.warning.main,
                },
              ]}
            >
              {tests.gradeLetter}
            </Text>
          </View>
        </View>
      </Card>

      {/* Tests Scorecard List */}
      {tests.items.length === 0 ? (
        <EmptyState
          icon="award"
          title="No test records"
          description="No tests or assessments have been recorded for this batch yet."
        />
      ) : (
        <View style={styles.testList}>
          {tests.items.map((test) => {
            const hasMarks = test.marksObtained !== undefined && test.marksObtained !== null;
            return (
              <Card key={test.id} variant="outlined" padding="md" style={styles.testCard}>
                <View style={styles.testHeaderRow}>
                  <View style={styles.testTitleWrap}>
                    <Text variant="heading" style={styles.testTitle}>
                      {test.title}
                    </Text>
                    <Text variant="caption" style={styles.testDate}>
                      Conducted: {formatDate(test.date)}
                    </Text>
                  </View>

                  {hasMarks ? (
                    <Badge
                      label={`Grade ${test.gradeLetter}`}
                      variant={
                        test.percentage && test.percentage >= 75
                          ? 'success'
                          : test.percentage && test.percentage >= 50
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                    />
                  ) : (
                    <Badge label="Not Entered" variant="neutral" size="sm" />
                  )}
                </View>

                {/* Score breakdown strip */}
                <View style={styles.scoreStrip}>
                  <View style={styles.scoreCol}>
                    <Text variant="caption" style={styles.scoreLabel}>
                      Marks Obtained
                    </Text>
                    <Text variant="label" style={styles.scoreVal}>
                      {hasMarks ? `${test.marksObtained} / ${test.maxMarks}` : `— / ${test.maxMarks}`}
                    </Text>
                  </View>

                  <View style={styles.scoreDivider} />

                  <View style={styles.scoreCol}>
                    <Text variant="caption" style={styles.scoreLabel}>
                      Percentage
                    </Text>
                    <Text variant="label" style={[styles.scoreVal, { color: theme.colors.primary.main }]}>
                      {hasMarks ? `${test.percentage}%` : '—'}
                    </Text>
                  </View>

                  <View style={styles.scoreDivider} />

                  <View style={styles.scoreCol}>
                    <Text variant="caption" style={styles.scoreLabel}>
                      Status
                    </Text>
                    <Text
                      variant="label"
                      style={[
                        styles.scoreVal,
                        {
                          color: hasMarks
                            ? theme.colors.semantic.success.main
                            : theme.colors.text.disabled,
                        },
                      ]}
                    >
                      {hasMarks ? 'Graded' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContentSection: {
    gap: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border.main,
  },
  testList: {
    gap: 8,
  },
  testCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 12,
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  testTitleWrap: {
    flex: 1,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  scoreCol: {
    alignItems: 'center',
    gap: 2,
  },
  scoreLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  scoreVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  scoreDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border.main,
  },
});
