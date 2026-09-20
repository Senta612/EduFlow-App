import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { teacherService, isBatchScheduledOnDate } from '@/services/teacher.service';
import { Batch, Test, AttendanceRecord } from '@/types/teacher';
import { theme } from '@/theme';

function formatTodayFullDate(): string {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Teacher';
  return fullName.trim().split(/\s+/)[0];
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(offsetWeeks: number = 0): Date[] {
  const now = new Date();
  // Adjust by offset weeks
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetWeeks * 7);

  // Find Monday of the week
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

export default function TeacherHomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calendar State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toDateString(new Date()));

  const loadDashboardData = useCallback(async () => {
    try {
      const [allBatches, tests, attHistory] = await Promise.all([
        teacherService.getBatches(),
        teacherService.getTestsList(),
        teacherService.getAttendanceRecords(),
      ]);
      setBatches(allBatches);
      setUpcomingTests(tests);
      setAttendanceRecords(attHistory);
    } catch (error) {
      console.error('Failed to load teacher dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const unsubscribe = teacherService.subscribeBatches(() => {
      loadDashboardData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Compute week dates for calendar strip
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Calendar month header (e.g. "September 2026")
  const currentMonthTitle = useMemo(() => {
    if (weekDates.length === 0) return '';
    const midDate = weekDates[3] || weekDates[0];
    return midDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [weekDates]);

  // Compute attendance status for each day of the week
  const weekDaysData = useMemo(() => {
    const todayStr = toDateString(new Date());

    return weekDates.map((dateObj) => {
      const dateKey = toDateString(dateObj);
      const isToday = dateKey === todayStr;
      const isSelected = dateKey === selectedDateStr;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dateObj.getDate();

      // Find batches scheduled on this date
      const scheduledBatches = batches.filter((b) =>
        isBatchScheduledOnDate(b.schedule, dateObj),
      );

      // Find attendance records for this date
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
        dateObj,
        dateKey,
        dayName,
        dayNum,
        isToday,
        isSelected,
        status,
        scheduledCount: totalScheduled,
        completedCount,
      };
    });
  }, [weekDates, batches, attendanceRecords, selectedDateStr]);

  // Batches for the currently selected date in the calendar
  const selectedDateBatches = useMemo(() => {
    const targetDate = new Date(selectedDateStr);
    const dateRecords = attendanceRecords.filter((r) => r.date === selectedDateStr);
    const recordMap = new Map(dateRecords.map((r) => [r.batchId, r]));

    const scheduled = batches.filter((b) => isBatchScheduledOnDate(b.schedule, targetDate));
    const list = scheduled.length > 0 ? scheduled : batches;

    return list.map((b) => {
      const rec = recordMap.get(b.id);
      return {
        ...b,
        attendanceTakenForDate: Boolean(rec),
        attendanceRecord: rec,
      };
    });
  }, [batches, attendanceRecords, selectedDateStr]);

  const isSelectedDateToday = selectedDateStr === toDateString(new Date());

  const selectedDateLabel = useMemo(() => {
    try {
      const d = new Date(selectedDateStr);
      if (isSelectedDateToday) {
        return `Today • ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
      }
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr, isSelectedDateToday]);

  const pendingAttendanceCount = selectedDateBatches.filter(
    (c) => !c.attendanceTakenForDate,
  ).length;

  const completedAttendanceCount = selectedDateBatches.filter(
    (c) => c.attendanceTakenForDate,
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="caption" style={styles.greetingSub}>
            {formatTodayFullDate()}
          </Text>
          <Text variant="title" style={styles.greetingTitle}>
            {`${getGreeting()}, ${getFirstName(profile?.full_name)}`}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(teacher)/more/notifications')}
          hitSlop={8}
          style={styles.notifButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Feather name="bell" size={20} color={theme.colors.text.primary} />
          {pendingAttendanceCount > 0 && <View style={styles.notifBadge} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="body" style={styles.loadingText}>
              Loading today's schedule...
            </Text>
          </View>
        ) : (
          <>
            {/* ================= ATTENDANCE CALENDAR SECTION ================= */}
            <Card variant="elevated" padding="md" style={styles.calendarCard}>
              {/* Calendar Header with Navigation */}
              <View style={styles.calendarHeaderRow}>
                <View style={styles.calendarTitleGroup}>
                  <View style={styles.calendarIconCircle}>
                    <Feather name="calendar" size={16} color={theme.colors.primary.main} />
                  </View>
                  <Text variant="heading" style={styles.calendarMonthText}>
                    {currentMonthTitle}
                  </Text>
                </View>

                {/* Week Switchers */}
                <View style={styles.weekNavControls}>
                  <Pressable
                    hitSlop={8}
                    style={styles.navArrowBtn}
                    onPress={() => setWeekOffset((prev) => prev - 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous week"
                  >
                    <Feather name="chevron-left" size={18} color={theme.colors.text.primary} />
                  </Pressable>

                  {weekOffset !== 0 ? (
                    <Pressable
                      style={styles.todayResetPill}
                      onPress={() => {
                        setWeekOffset(0);
                        setSelectedDateStr(toDateString(new Date()));
                      }}
                    >
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
                    onPress={() => setWeekOffset((prev) => prev + 1)}
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
                      onPress={() => setSelectedDateStr(day.dateKey)}
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
                          <View style={[styles.statusDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.colors.semantic.success.main }]}>
                            {isSelected && <Feather name="check" size={8} color={theme.colors.primary.main} />}
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
                    {completedAttendanceCount === selectedDateBatches.length && selectedDateBatches.length > 0
                      ? `All ${selectedDateBatches.length} classes marked • 100% attendance complete`
                      : pendingAttendanceCount > 0
                      ? `${pendingAttendanceCount} of ${selectedDateBatches.length} batch attendance pending`
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
                  <Badge
                    label="All Done"
                    variant="success"
                    icon="check"
                    size="sm"
                  />
                )}
              </View>
            </Card>

            {/* ================= CLASSES FOR SELECTED DAY ================= */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text variant="heading" style={styles.sectionTitle}>
                    {isSelectedDateToday ? "Today's Classes" : `Classes for ${selectedDateLabel}`}
                  </Text>
                  <Badge
                    label={`${selectedDateBatches.length} Classes`}
                    variant="primary"
                    size="sm"
                  />
                </View>
                <Pressable onPress={() => router.push('/(teacher)/(tabs)/batches')}>
                  <Text variant="label" style={styles.seeAllLink}>
                    View All Batches
                  </Text>
                </Pressable>
              </View>

              {selectedDateBatches.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="No classes scheduled"
                  description={`You have no classes scheduled for ${selectedDateLabel}.`}
                />
              ) : (
                <View style={styles.classList}>
                  {selectedDateBatches.map((cls) => {
                    const isAttendancePending = !cls.attendanceTakenForDate;
                    const rec = cls.attendanceRecord;

                    return (
                      <Card
                        key={cls.id}
                        variant="elevated"
                        padding="md"
                        style={[
                          styles.classCard,
                          isAttendancePending && styles.classCardPending,
                        ]}
                      >
                        {/* Class Meta Header */}
                        <View style={styles.classCardHeader}>
                          <View style={styles.classTitleGroup}>
                            <Text variant="heading" style={styles.classSubject}>
                              {cls.name}
                            </Text>
                            <Text variant="body" style={styles.classGrade}>
                              {cls.grade} • {cls.subject}
                            </Text>
                          </View>

                          {isAttendancePending ? (
                            <Badge
                              label="Attendance Pending"
                              variant="warning"
                              size="sm"
                              icon="alert-circle"
                            />
                          ) : (
                            <Badge
                              label={rec ? `${rec.presentCount} Present` : 'Attendance Done'}
                              variant="success"
                              size="sm"
                              icon="check"
                            />
                          )}
                        </View>

                        {/* Schedule & Room info */}
                        <View style={styles.classMetaRow}>
                          <View style={styles.metaItem}>
                            <Feather
                              name="clock"
                              size={14}
                              color={theme.colors.text.secondary}
                            />
                            <Text variant="caption" style={styles.metaText}>
                              {cls.timing}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Feather
                              name="users"
                              size={14}
                              color={theme.colors.text.secondary}
                            />
                            <Text variant="caption" style={styles.metaText}>
                              {cls.studentCount} Students
                            </Text>
                          </View>
                          {cls.room && (
                            <View style={styles.metaItem}>
                              <Feather
                                name="map-pin"
                                size={14}
                                color={theme.colors.text.secondary}
                              />
                              <Text variant="caption" style={styles.metaText}>
                                {cls.room}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Action Row */}
                        <View style={styles.classActionRow}>
                          {isAttendancePending ? (
                            <Button
                              title="Take Attendance"
                              variant="primary"
                              fullWidth
                              onPress={() =>
                                router.push(`/(teacher)/attendance/${cls.id}`)
                              }
                            />
                          ) : (
                            <View style={styles.completedActions}>
                              <Button
                                title="Batch Workspace"
                                variant="secondary"
                                style={styles.actionBtnFlex}
                                onPress={() =>
                                  router.push(`/(teacher)/batch/${cls.id}`)
                                }
                              />
                              <Button
                                title="Update Attendance"
                                variant="outline"
                                style={styles.actionBtnFlex}
                                onPress={() =>
                                  router.push(`/(teacher)/attendance/${cls.id}`)
                                }
                              />
                            </View>
                          )}
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ================= QUICK ACTIONS ================= */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Quick Actions
              </Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={styles.quickActionCard}
                  onPress={() => {
                    const firstPending =
                      selectedDateBatches.find((c) => !c.attendanceTakenForDate) ?? batches[0];
                    if (firstPending) {
                      router.push(`/(teacher)/attendance/${firstPending.id}`);
                    } else {
                      router.push('/(teacher)/(tabs)/batches');
                    }
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: theme.colors.primary.bg },
                    ]}
                  >
                    <Feather
                      name="check-square"
                      size={22}
                      color={theme.colors.primary.main}
                    />
                  </View>
                  <Text variant="label" style={styles.quickActionLabel}>
                    Attendance
                  </Text>
                  <Text variant="caption" style={styles.quickActionSub}>
                    Mark daily presence
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionCard}
                  onPress={() => router.push('/(teacher)/homework/create')}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: theme.colors.semantic.info.bg },
                    ]}
                  >
                    <Feather
                      name="book-open"
                      size={22}
                      color={theme.colors.semantic.info.main}
                    />
                  </View>
                  <Text variant="label" style={styles.quickActionLabel}>
                    Homework
                  </Text>
                  <Text variant="caption" style={styles.quickActionSub}>
                    Publish assignment
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionCard}
                  onPress={() => {
                    if (upcomingTests.length > 0) {
                      router.push(
                        `/(teacher)/tests/${upcomingTests[0].id}/marks`,
                      );
                    } else {
                      router.push('/(teacher)/tests/create');
                    }
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: theme.colors.semantic.warning.bg },
                    ]}
                  >
                    <Feather
                      name="award"
                      size={22}
                      color={theme.colors.semantic.warning.main}
                    />
                  </View>
                  <Text variant="label" style={styles.quickActionLabel}>
                    Marks
                  </Text>
                  <Text variant="caption" style={styles.quickActionSub}>
                    Record test scores
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ================= UPCOMING ASSESSMENTS ================= */}
            {upcomingTests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="heading" style={styles.sectionTitle}>
                    Upcoming Tests & Assessments
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(teacher)/tests/create')}
                  >
                    <Text variant="label" style={styles.seeAllLink}>
                      + New Test
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.upcomingList}>
                  {upcomingTests.slice(0, 2).map((test) => (
                    <Card
                      key={test.id}
                      variant="outlined"
                      padding="md"
                      style={styles.testCard}
                    >
                      <View style={styles.testHeader}>
                        <View style={styles.testTitleCol}>
                          <Text variant="heading" style={styles.testTitle}>
                            {test.title}
                          </Text>
                          <Text variant="caption" style={styles.testSubtitle}>
                            {test.batchName} • Date: {test.date}
                          </Text>
                        </View>
                        <Badge
                          label={`Max ${test.maxMarks}m`}
                          variant="neutral"
                          size="sm"
                        />
                      </View>

                      <View style={styles.testActionRow}>
                        <Button
                          title="Enter / Review Marks →"
                          variant="outline"
                          fullWidth
                          onPress={() =>
                            router.push(`/(teacher)/tests/${test.id}/marks`)
                          }
                        />
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  headerLeft: {
    flex: 1,
  },
  greetingSub: {
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
    fontWeight: '700',
  },
  greetingTitle: {
    color: theme.colors.text.primary,
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
  },
  notifButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.semantic.danger.main,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },

  // Calendar Card styles
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
    gap: 8,
  },
  calendarIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 15,
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

  // Week strip row
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

  // Day Summary Banner
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

  // Section Styles
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  seeAllLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.sm,
  },

  // Class list styles
  classList: {
    gap: theme.spacing.sm,
  },
  classCard: {
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  classCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.semantic.warning.main,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  classTitleGroup: {
    flex: 1,
  },
  classSubject: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  classGrade: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: theme.typography.sizes.xs,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: theme.colors.text.secondary,
  },
  classActionRow: {
    marginTop: 2,
  },
  completedActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtnFlex: {
    flex: 1,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    gap: 4,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  quickActionSub: {
    color: theme.colors.text.disabled,
    textAlign: 'center',
    fontSize: 10,
  },

  // Upcoming Tests
  upcomingList: {
    gap: theme.spacing.sm,
  },
  testCard: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  testTitleCol: {
    flex: 1,
  },
  testTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: theme.typography.weights.bold,
  },
  testSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: 11,
  },
  testActionRow: {
    marginTop: 2,
  },
});
