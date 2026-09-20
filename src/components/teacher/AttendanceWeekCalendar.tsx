import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Batch, AttendanceRecord } from '@/types/teacher';
import { isBatchScheduledOnDate } from '@/services/teacher.service';
import { theme } from '@/theme';

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(offsetWeeks: number = 0): Date[] {
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetWeeks * 7);
  const dayOfWeek = anchor.getDay(); // 0 is Sun, 1 is Mon
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + distanceToMon);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

interface AttendanceWeekCalendarProps {
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetToday: () => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onPressMonthTitle?: () => void;
  batches: Batch[];
  attendanceRecords: AttendanceRecord[];
  selectedDateBatchesCount: number;
  completedAttendanceCount: number;
  pendingAttendanceCount: number;
  selectedDateLabel: string;
}

export const AttendanceWeekCalendar: React.FC<AttendanceWeekCalendarProps> = ({
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onResetToday,
  selectedDateStr,
  onSelectDate,
  onPressMonthTitle,
  batches,
  attendanceRecords,
  selectedDateBatchesCount,
  completedAttendanceCount,
  pendingAttendanceCount,
  selectedDateLabel,
}) => {
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const currentMonthTitle = useMemo(() => {
    if (weekDates.length === 0) return '';
    const midDate = weekDates[3] || weekDates[0];
    return midDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [weekDates]);

  const weekDaysData = useMemo(() => {
    const todayStr = toDateString(new Date());

    return weekDates.map((dateObj) => {
      const dateKey = toDateString(dateObj);
      const isToday = dateKey === todayStr;
      const isSelected = dateKey === selectedDateStr;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dateObj.getDate();

      const scheduledBatches = batches.filter((b) =>
        isBatchScheduledOnDate(b.schedule, dateObj),
      );

      const dateRecords = attendanceRecords.filter((r) => r.date === dateKey);
      const completedCount = dateRecords.length;
      const totalScheduled = scheduledBatches.length > 0 ? scheduledBatches.length : batches.length;

      let status: 'completed' | 'pending' | 'off' | 'future' = 'off';

      if (totalScheduled === 0) {
        status = 'off';
      } else if (completedCount >= totalScheduled && totalScheduled > 0) {
        status = 'completed';
      } else if (dateObj <= new Date()) {
        status = 'pending';
      } else {
        status = 'future';
      }

      return {
        dateKey,
        dayName,
        dayNum,
        isToday,
        isSelected,
        status,
      };
    });
  }, [weekDates, batches, attendanceRecords, selectedDateStr]);

  return (
    <Card variant="elevated" padding="md" style={styles.calendarCard}>
      {/* Calendar Header with Navigation */}
      <View style={styles.calendarHeaderRow}>
        <Pressable
          style={styles.calendarTitleGroup}
          onPress={onPressMonthTitle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open full calendar for ${currentMonthTitle}`}
        >
          <View style={styles.calendarIconCircle}>
            <Feather name="calendar" size={16} color={theme.colors.primary.main} />
          </View>
          <Text variant="heading" style={styles.calendarMonthText}>
            {currentMonthTitle}
          </Text>
          <Feather name="chevron-down" size={16} color={theme.colors.text.secondary} />
        </Pressable>

        {/* Week Switchers */}
        <View style={styles.weekNavControls}>
          <Pressable
            hitSlop={8}
            style={styles.navArrowBtn}
            onPress={onPrevWeek}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <Feather name="chevron-left" size={18} color={theme.colors.text.primary} />
          </Pressable>

          {weekOffset !== 0 ? (
            <Pressable style={styles.todayResetPill} onPress={onResetToday}>
              <Text variant="caption" style={styles.todayResetText}>
                Today
              </Text>
            </Pressable>
          ) : (
            <View style={styles.currentWeekTag}>
              <Text variant="caption" style={styles.currentWeekText}>
                This Week
              </Text>
            </View>
          )}

          <Pressable
            hitSlop={8}
            style={styles.navArrowBtn}
            onPress={onNextWeek}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <Feather name="chevron-right" size={18} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* 7-Day Interactive Week Strip */}
      <View style={styles.weekStripRow}>
        {weekDaysData.map((day) => {
          const isSelected = day.isSelected;
          const isToday = day.isToday;

          return (
            <Pressable
              key={day.dateKey}
              style={[
                styles.dayPill,
                isSelected && styles.dayPillSelected,
                isToday && !isSelected && styles.dayPillToday,
              ]}
              onPress={() => onSelectDate(day.dateKey)}
            >
              <Text
                variant="caption"
                style={[
                  styles.dayNameText,
                  isSelected && styles.dayNameTextSelected,
                  isToday && !isSelected && styles.dayNameTextToday,
                ]}
              >
                {day.dayName.toUpperCase()}
              </Text>

              <Text
                variant="label"
                style={[
                  styles.dayNumText,
                  isSelected && styles.dayNumTextSelected,
                  isToday && !isSelected && styles.dayNumTextToday,
                ]}
              >
                {day.dayNum}
              </Text>

              {/* Status Indicator Dot / Badge */}
              <View style={styles.dayStatusIndicatorWrap}>
                {day.status === 'completed' ? (
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isSelected
                          ? '#FFFFFF'
                          : theme.colors.semantic.success.main,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={8} color={theme.colors.primary.main} />
                    )}
                  </View>
                ) : day.status === 'pending' ? (
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isSelected
                          ? '#FEF08A'
                          : theme.colors.semantic.warning.main,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.statusDotMuted,
                      { backgroundColor: isSelected ? 'rgba(255,255,255,0.4)' : '#CBD5E1' },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Day Status Summary Banner */}
      <View style={styles.daySummaryBanner}>
        <View style={styles.daySummaryInfo}>
          <Text variant="label" style={styles.daySummaryTitle}>
            {selectedDateLabel}
          </Text>
          <Text variant="caption" style={styles.daySummaryDesc}>
            {completedAttendanceCount === selectedDateBatchesCount && selectedDateBatchesCount > 0
              ? `All ${selectedDateBatchesCount} classes marked • 100% attendance complete`
              : pendingAttendanceCount > 0
              ? `${pendingAttendanceCount} of ${selectedDateBatchesCount} batch attendance pending`
              : `No scheduled classes for this date`}
          </Text>
        </View>

        {pendingAttendanceCount > 0 ? (
          <Badge
            label={`${pendingAttendanceCount} Pending`}
            variant="warning"
            icon="alert-circle"
            size="sm"
          />
        ) : (
          <Badge label="All Done" variant="success" icon="check" size="sm" />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 14,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  calendarIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  weekNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background.screen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  todayResetPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.bg,
  },
  todayResetText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  currentWeekTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentWeekText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 3,
  },
  dayPillToday: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  dayPillSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNameText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  dayNameTextToday: {
    color: theme.colors.primary.main,
  },
  dayNameTextSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  dayNumText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  dayNumTextToday: {
    color: theme.colors.primary.main,
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
  },
  dayStatusIndicatorWrap: {
    marginTop: 2,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotMuted: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  daySummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  daySummaryInfo: {
    flex: 1,
    gap: 2,
  },
  daySummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  daySummaryDesc: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});
