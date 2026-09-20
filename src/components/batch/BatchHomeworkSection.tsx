import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Batch, Homework } from '@/types/teacher';
import { theme } from '@/theme';

interface BatchHomeworkSectionProps {
  batch: Batch;
  homeworkList: Homework[];
  onCreateHomework: () => void;
  onOpenHomeworkSubmissions: (hwId: string) => void;
}

export const BatchHomeworkSection: React.FC<BatchHomeworkSectionProps> = ({
  batch,
  homeworkList,
  onCreateHomework,
  onOpenHomeworkSubmissions,
}) => {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.blockHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleWithBadge}>
            <Text variant="heading" style={styles.blockTitle}>
              Homework
            </Text>
            {homeworkList.length > 0 && (
              <Badge
                label={`${homeworkList.length}`}
                variant="primary"
                size="sm"
              />
            )}
          </View>
          <Text variant="caption" style={styles.headerSubtitle}>
            Assignments & submission tracking
          </Text>
        </View>
        <Button
          title="Create"
          icon="plus"
          size="sm"
          variant="primary"
          onPress={onCreateHomework}
        />
      </View>

      {homeworkList.length === 0 ? (
        <EmptyState
          icon="book-open"
          title="No homework yet"
          description="Assign practice exercises and homework to this batch."
          actionLabel="Create Homework"
          onAction={onCreateHomework}
        />
      ) : (
        homeworkList.map((hw) => {
          const total = hw.totalStudents || 1;
          const submissionRate = Math.round(((hw.submissionsCount || 0) / total) * 100);

          return (
            <Card key={hw.id} variant="elevated" padding="md" style={styles.hwCard}>
              <View style={styles.hwTopRow}>
                <View style={styles.hwIconBox}>
                  <Feather name="book-open" size={16} color={theme.colors.primary.main} />
                </View>
                <View style={styles.hwTitleWrapper}>
                  <Text variant="heading" style={styles.hwTitle}>
                    {hw.title}
                  </Text>
                  <View style={styles.hwMetaInline}>
                    <Feather name="clock" size={11} color={theme.colors.text.disabled} />
                    <Text variant="caption" style={styles.hwCreated}>
                      Posted {hw.createdAt}
                    </Text>
                  </View>
                </View>
                <Badge
                  label={`Due ${hw.dueDate}`}
                  variant={hw.isGraded ? 'neutral' : 'warning'}
                  size="sm"
                />
              </View>

              {hw.description ? (
                <Text variant="caption" numberOfLines={2} style={styles.hwDescription}>
                  {hw.description}
                </Text>
              ) : null}

              {/* Submission Progress bar */}
              <View style={styles.hwProgressSection}>
                <View style={styles.hwProgressLabelRow}>
                  <Text variant="caption" style={styles.hwProgressText}>
                    Submissions: {hw.submissionsCount} of {total}
                  </Text>
                  <Text variant="caption" style={styles.hwProgressPct}>
                    {submissionRate}%
                  </Text>
                </View>
                <View style={styles.hwProgressTrack}>
                  <View
                    style={[
                      styles.hwProgressFill,
                      {
                        width: `${Math.min(100, Math.max(0, submissionRate))}%`,
                        backgroundColor:
                          submissionRate >= 75
                            ? theme.colors.semantic.success.main
                            : theme.colors.primary.main,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Card Actions */}
              <View style={styles.hwActionsRow}>
                <Button
                  title="Check Submissions"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={() => onOpenHomeworkSubmissions(hw.id)}
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
  hwCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 12,
  },
  hwTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  hwIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hwTitleWrapper: {
    flex: 1,
    gap: 2,
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  hwMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hwCreated: {
    fontSize: 11,
    color: theme.colors.text.disabled,
  },
  hwDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  hwProgressSection: {
    gap: 4,
  },
  hwProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hwProgressText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  hwProgressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  hwProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hwProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  hwActionsRow: {
    paddingTop: 4,
  },
});
