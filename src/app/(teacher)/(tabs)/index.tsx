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
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AttendanceWeekCalendar,
  TodayClassCard,
  QuickActionGrid,
  UpcomingTestsSection,
  MonthCalendarModal,
} from '@/components/teacher';
import { useAuth } from '@/hooks/useAuth';
import { teacherService, isBatchScheduledOnDate } from '@/services/teacher.service';
import { Batch, Test, AttendanceRecord } from '@/types/teacher';
import { theme } from '@/theme';

function formatTodayFullDate(): string {
  return new Date().toLocaleDateString('en-US', {
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
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

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
    return () => unsubscribe();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

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
            {/* 1. Interactive Week Attendance Calendar (Click Month to open full calendar modal) */}
            <AttendanceWeekCalendar
              weekOffset={weekOffset}
              onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
              onNextWeek={() => setWeekOffset((prev) => prev + 1)}
              onResetToday={() => {
                setWeekOffset(0);
                setSelectedDateStr(toDateString(new Date()));
              }}
              selectedDateStr={selectedDateStr}
              onSelectDate={setSelectedDateStr}
              onPressMonthTitle={() => setIsMonthModalVisible(true)}
              batches={batches}
              attendanceRecords={attendanceRecords}
              selectedDateBatchesCount={selectedDateBatches.length}
              completedAttendanceCount={completedAttendanceCount}
              pendingAttendanceCount={pendingAttendanceCount}
              selectedDateLabel={selectedDateLabel}
            />

            {/* 2. Classes for Selected Day */}
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
                  {selectedDateBatches.map((cls) => (
                    <TodayClassCard
                      key={cls.id}
                      cls={cls}
                      onTakeAttendance={(batchId) =>
                        router.push(`/(teacher)/attendance/${batchId}`)
                      }
                      onOpenBatchWorkspace={(batchId) =>
                        router.push(`/(teacher)/batch/${batchId}`)
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            {/* 3. Quick Actions */}
            <QuickActionGrid
              onPressAttendance={() => {
                const firstPending =
                  selectedDateBatches.find((c) => !c.attendanceTakenForDate) ?? batches[0];
                if (firstPending) {
                  router.push(`/(teacher)/attendance/${firstPending.id}`);
                } else {
                  router.push('/(teacher)/(tabs)/batches');
                }
              }}
              onPressHomework={() => router.push('/(teacher)/homework/create')}
              onPressMarks={() => {
                if (upcomingTests.length > 0) {
                  router.push(`/(teacher)/tests/${upcomingTests[0].id}/marks`);
                } else {
                  router.push('/(teacher)/tests/create');
                }
              }}
            />

            {/* 4. Upcoming Tests */}
            <UpcomingTestsSection
              upcomingTests={upcomingTests}
              onCreateTest={() => router.push('/(teacher)/tests/create')}
              onEnterMarks={(testId) => router.push(`/(teacher)/tests/${testId}/marks`)}
            />
          </>
        )}
      </ScrollView>

      {/* 5. Full Month Attendance Calendar Modal */}
      <MonthCalendarModal
        visible={isMonthModalVisible}
        onClose={() => setIsMonthModalVisible(false)}
        selectedDateStr={selectedDateStr}
        onSelectDate={(dateStr, offset) => {
          setSelectedDateStr(dateStr);
          setWeekOffset(offset);
        }}
        batches={batches}
        attendanceRecords={attendanceRecords}
      />
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
  classList: {
    gap: theme.spacing.sm,
  },
});
