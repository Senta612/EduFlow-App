import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Batch, Test } from '@/types/teacher';
import { theme } from '@/theme';

function formatRecordDate(dateStr: string): string {
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

interface BatchTestsSectionProps {
  batch: Batch;
  testsList: Test[];
  onCreateTest: () => void;
  onOpenMarks: (testId: string) => void;
}

export const BatchTestsSection: React.FC<BatchTestsSectionProps> = ({
  batch,
  testsList,
  onCreateTest,
  onOpenMarks,
}) => {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.blockHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleWithBadge}>
            <Text variant="heading" style={styles.blockTitle}>
              Tests & Marks
            </Text>
            {testsList.length > 0 && (
              <Badge
                label={`${testsList.length}`}
                variant="primary"
                size="sm"
              />
            )}
          </View>
          <Text variant="caption" style={styles.headerSubtitle}>
            Recorded test scores & evaluations
          </Text>
        </View>
        <Button
          title="Create"
          icon="plus"
          size="sm"
          variant="primary"
          onPress={onCreateTest}
        />
      </View>

      {testsList.length === 0 ? (
        <EmptyState
          icon="award"
          title="No tests created"
          description="Create tests to record and evaluate student marks."
          actionLabel="Create Test"
          onAction={onCreateTest}
        />
      ) : (
        testsList.map((test) => {
          const total = test.totalStudents || 1;
          const marksEnteredRate = Math.round(((test.submittedCount || 0) / total) * 100);

          return (
            <Card key={test.id} variant="elevated" padding="md" style={styles.testCard}>
              <View style={styles.testTopRow}>
                <View style={styles.testIconBox}>
                  <Feather name="award" size={16} color="#8B5CF6" />
                </View>
                <View style={styles.testTitleWrapper}>
                  <Text variant="heading" style={styles.testTitle}>
                    {test.title}
                  </Text>
                  <View style={styles.testMetaInline}>
                    <Feather name="calendar" size={11} color={theme.colors.text.disabled} />
                    <Text variant="caption" style={styles.testDate}>
                      Conducted {formatRecordDate(test.date)}
                    </Text>
                  </View>
                </View>
                <Badge
                  label={`Max ${test.maxMarks}m`}
                  variant="neutral"
                  size="sm"
                />
              </View>

              {/* Marks Entered Progress bar */}
              <View style={styles.testProgressSection}>
                <View style={styles.testProgressLabelRow}>
                  <Text variant="caption" style={styles.testProgressText}>
                    Graded: {test.submittedCount || 0} of {total} Students
                  </Text>
                  <Text variant="caption" style={styles.testProgressPct}>
                    {marksEnteredRate}%
                  </Text>
                </View>
                <View style={styles.testProgressTrack}>
                  <View
                    style={[
                      styles.testProgressFill,
                      {
                        width: `${Math.min(100, Math.max(0, marksEnteredRate))}%`,
                        backgroundColor:
                          marksEnteredRate === 100
                            ? theme.colors.semantic.success.main
                            : '#8B5CF6',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Action */}
              <View style={styles.testActionsRow}>
                <Button
                  title={marksEnteredRate === 100 ? 'View / Edit Marks' : 'Enter Marks'}
                  variant={marksEnteredRate === 100 ? 'outline' : 'primary'}
                  size="sm"
                  fullWidth
                  onPress={() => onOpenMarks(test.id)}
                />
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: theme.spacing.lg,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  testCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 12,
  },
  testTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  testIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testTitleWrapper: {
    flex: 1,
    gap: 2,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testDate: {
    fontSize: 11,
    color: theme.colors.text.disabled,
  },
  testProgressSection: {
    gap: 4,
  },
  testProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testProgressText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  testProgressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  testProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  testActionsRow: {
    paddingTop: 4,
  },
});
