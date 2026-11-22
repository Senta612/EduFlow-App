import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { SyncStatusBadge } from '@/components/common';
import { SubscriptionExpiredModal } from '@/components/subscription';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { teacherService, isBatchScheduledOnDate } from '@/services/teacher.service';
import { useSubscription } from '@/hooks/useSubscription';
import { Batch, Test, AttendanceRecord } from '@/types/teacher';
import { theme } from '@/theme';

function formatTodayFullDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
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
  const sub = useSubscription();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  const [batches, setBatches] = useState<Batch[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calendar State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toDateString(new Date()));
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [isExpiredModalVisible, setIsExpiredModalVisible] = useState(false);
  const [expiredFeature, setExpiredFeature] = useState('Class Management');

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

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  useEffect(() => {
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
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      if (isSelectedDateToday) {
        return `Today • ${targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
      }
      return targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr, isSelectedDateToday]);

  const scheduleSectionTitle = useMemo(() => {
    const today = new Date();
    const todayStr = toDateString(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toDateString(tomorrow);

    if (selectedDateStr === todayStr) {
      return t('dashboard.todaySchedule');
    }
    if (selectedDateStr === yesterdayStr) {
      return "Yesterday's Schedule";
    }
    if (selectedDateStr === tomorrowStr) {
      return "Tomorrow's Schedule";
    }

    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      const formattedDate = targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return `${formattedDate} Schedule`;
    } catch {
      return `${selectedDateStr} Schedule`;
    }
  }, [selectedDateStr, t]);

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
        <View style={styles.headerRightActions}>
          <SyncStatusBadge />
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
              {t('dashboard.loadingSchedule')}
            </Text>
          </View>
        ) : (
          <>
            {/* Subscription Lifecycle Status Banner */}
            {sub.isExpired ? (
              <Pressable
                style={styles.subBannerExpired}
                onPress={() => router.push('/(teacher)/subscription')}
              >
                <Feather name="alert-triangle" size={18} color="#DC2626" />
                <View style={styles.subBannerTextWrap}>
                  <Text style={styles.subBannerTitleExpired}>Pro Access Expired</Text>
                  <Text style={styles.subBannerDescExpired}>Renew your plan to record attendance, create homework, grade tests & manage batches.</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#DC2626" />
              </Pressable>
            ) : sub.pendingRequest ? (
              <Pressable
                style={styles.subBannerPending}
                onPress={() => router.push('/(teacher)/subscription/status')}
              >
                <Feather name="clock" size={18} color="#D97706" />
                <View style={styles.subBannerTextWrap}>
                  <Text style={styles.subBannerTitlePending}>Payment Verification In Progress</Text>
                  <Text style={styles.subBannerDescPending}>Ref: {sub.pendingRequest.paymentReference} — Pro will activate on approval.</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#D97706" />
              </Pressable>
            ) : sub.isTrial ? (
              <Pressable
                style={styles.subBannerTrial}
                onPress={() => router.push('/(teacher)/subscription')}
              >
                <Feather name="shield" size={18} color="#2563EB" />
                <View style={styles.subBannerTextWrap}>
                  <Text style={styles.subBannerTitleTrial}>30-Day Free Trial ({sub.daysRemaining} days left)</Text>
                  <Text style={styles.subBannerDescTrial}>Enjoying Pro? Lock in your annual discount before trial ends.</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#2563EB" />
              </Pressable>
            ) : null}

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
                    {scheduleSectionTitle}
                  </Text>
                  <Badge
                    label={t('dashboard.classesCount').replace('{count}', String(selectedDateBatches.length))}
                    variant="primary"
                    size="sm"
                  />
                </View>
                <Pressable onPress={() => router.push('/(teacher)/(tabs)/batches')}>
                  <Text variant="label" style={styles.seeAllLink}>
                    {t('dashboard.viewAllBatches')}
                  </Text>
                </Pressable>
              </View>

              {selectedDateBatches.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title={t('dashboard.noClassesScheduled')}
                  description={t('dashboard.noClassesScheduledDesc').replace('{date}', selectedDateLabel)}
                />
              ) : (
                <View style={styles.classList}>
                  {selectedDateBatches.map((cls) => (
                    <TodayClassCard
                      key={cls.id}
                      cls={cls}
                      onTakeAttendance={(batchId) => {
                        if (!sub.isPro) {
                          setExpiredFeature('Attendance Recording');
                          setIsExpiredModalVisible(true);
                          return;
                        }
                        router.push(
                          `/(teacher)/attendance/${batchId}${selectedDateStr ? `?date=${selectedDateStr}` : ''}` as unknown as import('expo-router').Href
                        );
                      }}
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
                if (!sub.isPro) {
                  setExpiredFeature('Attendance Recording');
                  setIsExpiredModalVisible(true);
                  return;
                }
                const firstPending =
                  selectedDateBatches.find((c) => !c.attendanceTakenForDate) ?? batches[0];
                if (firstPending) {
                  router.push(`/(teacher)/attendance/${firstPending.id}`);
                } else {
                  router.push('/(teacher)/(tabs)/batches');
                }
              }}
              onPressHomework={() => {
                if (!sub.isPro) {
                  setExpiredFeature('Homework Assignment');
                  setIsExpiredModalVisible(true);
                  return;
                }
                router.push('/(teacher)/homework/create');
              }}
              onPressMarks={() => {
                if (!sub.isPro) {
                  setExpiredFeature('Test Marks & Grading');
                  setIsExpiredModalVisible(true);
                  return;
                }
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
              onCreateTest={() => {
                if (!sub.isPro) {
                  setExpiredFeature('Test Creation');
                  setIsExpiredModalVisible(true);
                  return;
                }
                router.push('/(teacher)/tests/create');
              }}
              onEnterMarks={(testId) => {
                if (!sub.isPro) {
                  setExpiredFeature('Test Marks & Grading');
                  setIsExpiredModalVisible(true);
                  return;
                }
                router.push(`/(teacher)/tests/${testId}/marks`);
              }}
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

      {/* Subscription Expired Paywall Modal */}
      <SubscriptionExpiredModal
        visible={isExpiredModalVisible}
        onClose={() => setIsExpiredModalVisible(false)}
        featureName={expiredFeature}
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  subBannerExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  subBannerTextWrap: {
    flex: 1,
  },
  subBannerTitleExpired: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  subBannerDescExpired: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  subBannerPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
  },
  subBannerTitlePending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  subBannerDescPending: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  subBannerTrial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
  },
  subBannerTitleTrial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  subBannerDescTrial: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
});
