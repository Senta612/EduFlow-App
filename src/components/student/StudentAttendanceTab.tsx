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

interface StudentAttendanceTabProps {
  attendance: StudentProfileData['attendance'];
  filter: 'all' | 'present' | 'absent';
  onFilterChange: (f: 'all' | 'present' | 'absent') => void;
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({
  attendance,
  filter,
  onFilterChange,
}) => {
  const filteredHistory = attendance.history.filter((item) => {
    if (filter === 'present') return item.status === 'present';
    if (filter === 'absent') return item.status === 'absent';
    return true;
  });

  return (
    <View style={styles.tabContentSection}>
      {/* Attendance Summary Banner */}
      <Card variant="outlined" padding="md" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Present
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.semantic.success.main }]}>
              {attendance.presentCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Absent
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.semantic.danger.main }]}>
              {attendance.absentCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" style={styles.summaryLabel}>
              Attendance %
            </Text>
            <Text variant="heading" style={[styles.summaryNum, { color: theme.colors.primary.main }]}>
              {attendance.percentage}%
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
            All Sessions ({attendance.history.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'present' && styles.filterChipActive]}
          onPress={() => onFilterChange('present')}
        >
          <Text
            variant="label"
            style={[styles.filterChipText, filter === 'present' && styles.filterChipTextActive]}
          >
            Present ({attendance.presentCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'absent' && styles.filterChipActive]}
          onPress={() => onFilterChange('absent')}
        >
          <Text
            variant="label"
            style={[styles.filterChipText, filter === 'absent' && styles.filterChipTextActive]}
          >
            Absent ({attendance.absentCount})
          </Text>
        </Pressable>
      </View>

      {/* Session History List */}
      {filteredHistory.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No records match"
          description="No attendance sessions match the selected filter."
        />
      ) : (
        <View style={styles.historyList}>
          {filteredHistory.map((item) => (
            <Card key={item.id} variant="outlined" padding="md" style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIconWrap,
                      {
                        backgroundColor:
                          item.status === 'present'
                            ? theme.colors.semantic.success.bg
                            : theme.colors.semantic.danger.bg,
                      },
                    ]}
                  >
                    <Feather
                      name={item.status === 'present' ? 'check' : 'x'}
                      size={16}
                      color={
                        item.status === 'present'
                          ? theme.colors.semantic.success.main
                          : theme.colors.semantic.danger.main
                      }
                    />
                  </View>
                  <View>
                    <Text variant="label" style={styles.historyDate}>
                      {formatDate(item.date)}
                    </Text>
                    {item.timing && (
                      <Text variant="caption" style={styles.historyMeta}>
                        {item.timing}
                      </Text>
                    )}
                  </View>
                </View>

                <Badge
                  label={item.status === 'present' ? 'Present' : 'Absent'}
                  variant={item.status === 'present' ? 'success' : 'danger'}
                  size="sm"
                />
              </View>
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
  historyList: {
    gap: 8,
  },
  historyCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  historyMeta: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
