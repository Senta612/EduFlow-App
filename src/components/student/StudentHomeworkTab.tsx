import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

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

interface StudentHomeworkTabProps {
  homework: StudentProfileData['homework'];
  filter: 'all' | 'done' | 'pending';
  onFilterChange: (f: 'all' | 'done' | 'pending') => void;
}

export const StudentHomeworkTab: React.FC<StudentHomeworkTabProps> = ({
  homework,
  filter,
  onFilterChange,
}) => {
  const filteredItems = homework.items.filter((item) => {
    if (filter === 'done') return item.status === 'done';
    if (filter === 'pending') return item.status === 'half_done' || item.status === 'not_done';
    return true;
  });

  return (
    <View style={styles.tabContentSection}>
      {/* Summary Banner */}
      <Card variant="outlined" padding="md" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Completed
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.semantic.success.main }]}>
              {homework.doneCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Pending
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.semantic.warning.main }]}>
              {homework.pendingCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Completion %
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.primary.main }]}>
              {homework.completionPercentage}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => onFilterChange('all')}
        >
          <Text
            variant="label"
            style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}
          >
            All Tasks ({homework.totalAssigned})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'done' && styles.filterChipActive]}
          onPress={() => onFilterChange('done')}
        >
          <Text
            variant="label"
            style={[styles.filterChipText, filter === 'done' && styles.filterChipTextActive]}
          >
            Done ({homework.doneCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
          onPress={() => onFilterChange('pending')}
        >
          <Text
            variant="label"
            style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}
          >
            Pending ({homework.pendingCount})
          </Text>
        </Pressable>
      </View>

      {/* Homework Cards List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon="book-open"
          title="No homework tasks"
          description="No homework records match the selected filter."
        />
      ) : (
        <View style={styles.hwList}>
          {filteredItems.map((item) => (
            <Card key={item.id} variant="outlined" padding="md" style={styles.hwCard}>
              <View style={styles.hwHeader}>
                <View style={styles.hwTitleWrap}>
                  <Text variant="heading" style={styles.hwTitle}>
                    {item.title}
                  </Text>
                  <Text variant="caption" style={styles.hwDueDate}>
                    Due: {formatDate(item.dueDate)}
                  </Text>
                </View>

                <Badge
                  label={
                    item.status === 'done'
                      ? 'Done'
                      : item.status === 'half_done'
                      ? 'Partially Done'
                      : 'Not Done'
                  }
                  variant={
                    item.status === 'done'
                      ? 'success'
                      : item.status === 'half_done'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                  icon={item.status === 'done' ? 'check' : item.status === 'half_done' ? 'clock' : 'x'}
                />
              </View>

              {item.notes && (
                <View style={styles.hwNotesWrap}>
                  <Feather name="message-square" size={12} color={theme.colors.text.secondary} />
                  <Text variant="caption" style={styles.hwNotesText}>
                    {item.notes}
                  </Text>
                </View>
              )}
            </Card>
          ))}
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  hwList: {
    gap: 8,
  },
  hwCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 8,
  },
  hwHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  hwTitleWrap: {
    flex: 1,
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  hwDueDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  hwNotesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.screen,
    padding: 8,
    borderRadius: theme.radii.sm,
  },
  hwNotesText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});
