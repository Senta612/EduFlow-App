import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StudentTestResultView } from '@/types/student';
import { theme } from '@/theme';

interface StudentTestCardProps {
  test: StudentTestResultView;
}

export function StudentTestCard({ test }: StudentTestCardProps) {
  const percentage = test.percentage ?? 0;

  const getGradeVariant = (badge: string) => {
    if (badge.startsWith('A')) return 'success';
    if (badge.startsWith('B')) return 'primary';
    if (badge.startsWith('C')) return 'warning';
    return 'danger';
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.subjectText}>{test.subject}</Text>
          <Text style={styles.titleText}>{test.title}</Text>
        </View>
        <Badge
          label={`Grade ${test.gradeBadge}`}
          variant={getGradeVariant(test.gradeBadge) as any}
          size="sm"
        />
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreMain}>
            {test.marksObtained !== null ? test.marksObtained : '-'}
          </Text>
          <Text style={styles.scoreMax}>/{test.maxMarks} Marks</Text>
        </View>

        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>

      {/* Visual Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor:
                percentage >= 85
                  ? theme.colors.state.success
                  : percentage >= 60
                  ? theme.colors.primary.main
                  : theme.colors.state.warning,
            },
          ]}
        />
      </View>

      {/* Batch Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="award" size={13} color={theme.colors.primary.main} />
          <Text style={styles.statText}>
            Rank #{test.rankInBatch ?? '-'} of {test.totalStudents}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="bar-chart-2" size={13} color={theme.colors.text.tertiary} />
          <Text style={styles.statText}>Class Avg: {test.classAverage}</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="trending-up" size={13} color={theme.colors.state.success} />
          <Text style={styles.statText}>Top: {test.highestMarks}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Feather name="calendar" size={12} color={theme.colors.text.tertiary} />
        <Text style={styles.dateText}>{test.date}</Text>
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
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreMain: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  scoreMax: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  percentageContainer: {
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: theme.colors.background.screen,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
});
