import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Batch, AttendanceRecord } from '@/types/teacher';
import { isBatchScheduledOnDate } from '@/services/teacher.service';
import { theme } from '@/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateWeekOffset(targetDate: Date): number {
  const now = new Date();
  
  const currentDay = now.getDay();
  const currentDistToMon = currentDay === 0 ? -6 : 1 - currentDay;
  const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + currentDistToMon);
  currentMonday.setHours(0, 0, 0, 0);

  const targetDay = targetDate.getDay();
  const targetDistToMon = targetDay === 0 ? -6 : 1 - targetDay;
  const targetMonday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + targetDistToMon);
  targetMonday.setHours(0, 0, 0, 0);

  const diffTime = targetMonday.getTime() - currentMonday.getTime();
  return Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
}

interface MonthCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string, weekOffset: number) => void;
  batches: Batch[];
  attendanceRecords: AttendanceRecord[];
}

export const MonthCalendarModal: React.FC<MonthCalendarModalProps> = ({
  visible,
  onClose,
  selectedDateStr,
  onSelectDate,
  batches,
  attendanceRecords,
}) => {
  const initialDate = useMemo(() => {
    try {
      const d = new Date(selectedDateStr);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }, [selectedDateStr, visible]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11
  const [modalSelectedDateStr, setModalSelectedDateStr] = useState(selectedDateStr);

  React.useEffect(() => {
    if (visible) {
      try {
        const d = new Date(selectedDateStr);
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
          setModalSelectedDateStr(selectedDateStr);
        }
      } catch {
        // keep current
      }
    }
  }, [visible, selectedDateStr]);

  const monthTitle = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setModalSelectedDateStr(toDateString(today));
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const todayStr = toDateString(new Date());
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // 0 is Sun, 1 is Mon... convert so Mon is 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: {
      dateObj: Date;
      dateKey: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      status: 'completed' | 'pending' | 'off' | 'future';
      scheduledCount: number;
      completedCount: number;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(viewYear, viewMonth - 1, dayNum);
      const dateKey = toDateString(d);
      days.push({
        dateObj: d,
        dateKey,
        dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isSelected: dateKey === modalSelectedDateStr,
        status: 'off',
        scheduledCount: 0,
        completedCount: 0,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const dateKey = toDateString(d);
      const isToday = dateKey === todayStr;
      const isSelected = dateKey === modalSelectedDateStr;

      const scheduledBatches = batches.filter((b) =>
        isBatchScheduledOnDate(b.schedule, d),
      );
      const totalScheduled = scheduledBatches.length > 0 ? scheduledBatches.length : batches.length;

      const dateRecords = attendanceRecords.filter((r) => r.date === dateKey);
      const completedCount = dateRecords.length;

      let status: 'completed' | 'pending' | 'off' | 'future' = 'off';
      if (totalScheduled === 0) {
        status = 'off';
      } else if (completedCount >= totalScheduled && totalScheduled > 0) {
        status = 'completed';
      } else if (d <= new Date()) {
        status = 'pending';
      } else {
        status = 'future';
      }

      days.push({
        dateObj: d,
        dateKey,
        dayNum: i,
        isCurrentMonth: true,
        isToday,
        isSelected,
        status,
        scheduledCount: totalScheduled,
        completedCount,
      });
    }

    // Next month padding to fill out rows
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const dateKey = toDateString(d);
      days.push({
        dateObj: d,
        dateKey,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isSelected: dateKey === modalSelectedDateStr,
        status: 'off',
        scheduledCount: 0,
        completedCount: 0,
      });
    }

    return days;
  }, [viewYear, viewMonth, modalSelectedDateStr, batches, attendanceRecords]);

  // Selected date info preview
  const selectedDayInfo = useMemo(() => {
    try {
      const targetDate = new Date(modalSelectedDateStr);
      if (isNaN(targetDate.getTime())) return null;

      const scheduled = batches.filter((b) => isBatchScheduledOnDate(b.schedule, targetDate));
      const list = scheduled.length > 0 ? scheduled : batches;
      const dateRecords = attendanceRecords.filter((r) => r.date === modalSelectedDateStr);

      const isToday = modalSelectedDateStr === toDateString(new Date());
      const label = targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        targetDate,
        label,
        isToday,
        totalClasses: list.length,
        completedClasses: dateRecords.length,
        pendingClasses: Math.max(0, list.length - dateRecords.length),
      };
    } catch {
      return null;
    }
  }, [modalSelectedDateStr, batches, attendanceRecords]);

  const handleConfirmSelection = () => {
    try {
      const d = new Date(modalSelectedDateStr);
      const offset = calculateWeekOffset(d);
      onSelectDate(modalSelectedDateStr, offset);
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalBackdropTouch} onPress={onClose} />
        
        <View style={styles.modalSheet}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.calendarIconCircle}>
                <Feather name="calendar" size={18} color={theme.colors.primary.main} />
              </View>
              <View>
                <Text variant="title" style={styles.modalMainTitle}>
                  Attendance Calendar
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  Select any date to view classes & attendance logs
                </Text>
              </View>
            </View>

            <Pressable hitSlop={8} onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Month Switcher Bar */}
          <View style={styles.monthNavRow}>
            <Text variant="heading" style={styles.monthTitleText}>
              {monthTitle}
            </Text>

            <View style={styles.navControls}>
              <Pressable
                hitSlop={8}
                style={styles.navBtn}
                onPress={handlePrevMonth}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Feather name="chevron-left" size={18} color={theme.colors.text.primary} />
              </Pressable>

              <Pressable style={styles.todayBtn} onPress={handleJumpToday}>
                <Text variant="caption" style={styles.todayBtnText}>
                  Today
                </Text>
              </Pressable>

              <Pressable
                hitSlop={8}
                style={styles.navBtn}
                onPress={handleNextMonth}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Feather name="chevron-right" size={18} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text variant="caption" style={styles.weekdayText}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 7xN Calendar Days Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, idx) => {
              const isSelected = day.isSelected;
              const isCurrentMonth = day.isCurrentMonth;
              const isToday = day.isToday;

              return (
                <Pressable
                  key={`${day.dateKey}-${idx}`}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayCellOutside,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setModalSelectedDateStr(day.dateKey)}
                >
                  <Text
                    variant="label"
                    style={[
                      styles.dayNumber,
                      !isCurrentMonth && styles.dayNumberOutside,
                      isToday && !isSelected && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.dayNum}
                  </Text>

                  {/* Attendance Status Dot */}
                  {isCurrentMonth && (
                    <View style={styles.cellDotWrap}>
                      {day.status === 'completed' ? (
                        <View
                          style={[
                            styles.cellDot,
                            {
                              backgroundColor: isSelected
                                ? '#FFFFFF'
                                : theme.colors.semantic.success.main,
                            },
                          ]}
                        />
                      ) : day.status === 'pending' ? (
                        <View
                          style={[
                            styles.cellDot,
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
                            styles.cellDotMuted,
                            {
                              backgroundColor: isSelected
                                ? 'rgba(255,255,255,0.4)'
                                : '#E2E8F0',
                            },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Legend Strip */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.semantic.success.main }]} />
              <Text variant="caption" style={styles.legendText}>
                Completed
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.semantic.warning.main }]} />
              <Text variant="caption" style={styles.legendText}>
                Pending
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
              <Text variant="caption" style={styles.legendText}>
                Scheduled
              </Text>
            </View>
          </View>

          {/* Selected Date Summary Preview Card */}
          {selectedDayInfo && (
            <Card variant="outlined" padding="md" style={styles.selectionPreviewCard}>
              <View style={styles.previewInfo}>
                <View style={styles.previewTitleRow}>
                  <Text variant="label" style={styles.previewDateLabel}>
                    {selectedDayInfo.label}
                  </Text>
                  {selectedDayInfo.isToday && (
                    <Badge label="Today" variant="primary" size="sm" />
                  )}
                </View>

                <Text variant="caption" style={styles.previewDesc}>
                  {selectedDayInfo.completedClasses === selectedDayInfo.totalClasses &&
                  selectedDayInfo.totalClasses > 0
                    ? `All ${selectedDayInfo.totalClasses} classes marked for this day`
                    : selectedDayInfo.pendingClasses > 0
                    ? `${selectedDayInfo.pendingClasses} of ${selectedDayInfo.totalClasses} classes pending attendance`
                    : `No classes scheduled`}
                </Text>
              </View>

              <Button
                title="View Day Schedule →"
                variant="primary"
                size="sm"
                onPress={handleConfirmSelection}
              />
            </Card>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.screen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.bg,
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    marginVertical: 2,
    gap: 2,
  },
  dayCellOutside: {
    opacity: 0.25,
  },
  dayCellToday: {
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary.main,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  dayNumberOutside: {
    color: theme.colors.text.disabled,
  },
  dayNumberToday: {
    color: theme.colors.primary.main,
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cellDotWrap: {
    height: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cellDotMuted: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  selectionPreviewCard: {
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.lg,
    gap: 10,
  },
  previewInfo: {
    gap: 2,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  previewDesc: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});
