import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AttendanceRecord, Batch } from '@/types/teacher';
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

interface BatchAttendanceSectionProps {
  batch: Batch;
  attendanceHistory: AttendanceRecord[];
  onTakeAttendance: () => void;
  onOpenAttendanceDetail: (record: AttendanceRecord) => void;
}

export const BatchAttendanceSection: React.FC<BatchAttendanceSectionProps> = ({
  batch,
  attendanceHistory,
  onTakeAttendance,
  onOpenAttendanceDetail,
}) => {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.blockHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleWithBadge}>
            <Text variant="heading" style={styles.blockTitle}>
              Attendance History
            </Text>
            {attendanceHistory.length > 0 && (
              <Badge
                label={`${attendanceHistory.length}`}
                variant="primary"
                size="sm"
              />
            )}
          </View>
          <Text variant="caption" style={styles.headerSubtitle}>
            Daily presence logs & summaries
          </Text>
        </View>
        <Button
          title="Mark Today"
          icon="check-square"
          size="sm"
          variant="primary"
          onPress={onTakeAttendance}
        />
      </View>

      {attendanceHistory.length === 0 ? (
        <EmptyState
          icon="check-square"
          title="No attendance records"
          description="Attendance taken for this batch will be logged here."
          actionLabel="Take Attendance"
          onAction={onTakeAttendance}
        />
      ) : (
        attendanceHistory.map((rec) => {
          const total = rec.totalStudents || 1;
          const attendanceRate = Math.round((rec.presentCount / total) * 100);
          const isGreat = attendanceRate >= 85;

          return (
            <Card key={rec.id} variant="outlined" padding="none" style={styles.attCard}>
              <Pressable
                style={({ pressed }) => [styles.attCardPressable, pressed && styles.attCardPressed]}
                onPress={() => onOpenAttendanceDetail(rec)}
              >
                <View style={styles.attCardHeader}>
                  <View style={styles.attDateGroup}>
                    <View
                      style={[
                        styles.attCalendarIconBox,
                        {
                          backgroundColor: isGreat
                            ? theme.colors.semantic.success.bg
                            : theme.colors.primary.bg,
                        },
                      ]}
                    >
                      <Feather
                        name="calendar"
                        size={16}
                        color={
                          isGreat
                            ? theme.colors.semantic.success.main
                            : theme.colors.primary.main
                        }
                      />
                    </View>
                    <View>
                      <Text variant="label" style={styles.attDateText}>
                        {formatRecordDate(rec.date)}
                      </Text>
                      <Text variant="caption" style={styles.attSubText}>
                        {batch.name} • Class Session
                      </Text>
                    </View>
                  </View>
                  <Badge
                    label={`${attendanceRate}% Present`}
                    variant={isGreat ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>

                {/* Presence Progress Bar */}
                <View style={styles.attProgressBarTrack}>
                  <View
                    style={[
                      styles.attProgressBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, attendanceRate))}%`,
                        backgroundColor: isGreat
                          ? theme.colors.semantic.success.main
                          : theme.colors.semantic.warning.main,
                      },
                    ]}
                  />
                </View>

                <View style={styles.attBottomRow}>
                  <View style={styles.attStatsRow}>
                    <Badge
                      label={`${rec.presentCount} Present`}
                      variant="success"
                      icon="check"
                      size="sm"
                    />
                    <Badge
                      label={`${rec.absentCount} Absent`}
                      variant="danger"
                      icon="x"
                      size="sm"
                    />
                  </View>
                  <View style={styles.attViewHintRow}>
                    <Text variant="caption" style={styles.attViewHintText}>
                      View Students
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={theme.colors.primary.main}
                    />
                  </View>
                </View>
              </Pressable>
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
  attCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  attCardPressable: {
    padding: theme.spacing.md,
    gap: 10,
  },
  attCardPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  attCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attCalendarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  attSubText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  attProgressBarTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  attProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  attBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  attStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attViewHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attViewHintText: {
    fontSize: 11,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});
