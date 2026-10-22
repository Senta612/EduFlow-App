import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  timetableService,
  DAYS_OF_WEEK,
  DayOfWeek,
  WeeklyTimetableOverview,
  TimetableSlot,
} from '@/services/teacher/timetable.service';
import { theme } from '@/theme';

function getTodayDayName(): DayOfWeek {
  const dayMap: Record<number, DayOfWeek> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  return dayMap[new Date().getDay()];
}

export default function TeacherTimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const todayDay = useMemo(() => getTodayDayName(), []);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDay);
  const [overview, setOverview] = useState<WeeklyTimetableOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await timetableService.getWeeklySchedule();
      setOverview(data);
    } catch (e) {
      console.error('Failed to load timetable:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const currentDaySchedule = useMemo(() => {
    if (!overview) return null;
    return overview.days.find((d) => d.day === selectedDay) || null;
  }, [overview, selectedDay]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Weekly Timetable"
        subtitle="Visual class schedule & classroom timeline"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Weekly Stats Summary Banner */}
        {overview && (
          <Card variant="elevated" padding="md" style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.summaryItem}>
                <Text variant="caption" style={styles.summaryLabel}>
                  Weekly Classes
                </Text>
                <Text style={styles.summaryValue}>{overview.totalWeeklyClasses}</Text>
                <Text variant="caption" style={styles.summarySub}>
                  Batches scheduled
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryItem}>
                <Text variant="caption" style={styles.summaryLabel}>
                  Teaching Hours
                </Text>
                <Text style={styles.summaryValue}>{overview.totalWeeklyHours}h</Text>
                <Text variant="caption" style={styles.summarySub}>
                  Per week
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryItem}>
                <Text variant="caption" style={styles.summaryLabel}>
                  Room Conflicts
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        overview.conflictCount > 0
                          ? theme.colors.semantic.danger.main
                          : theme.colors.semantic.success.main,
                    },
                  ]}
                >
                  {overview.conflictCount > 0 ? `${overview.conflictCount}` : 'None'}
                </Text>
                <Text variant="caption" style={styles.summarySub}>
                  {overview.conflictCount > 0 ? 'Overlaps found' : 'Schedule optimal'}
                </Text>
              </View>
            </View>

            {/* Next class spotlight */}
            {overview.nextClassToday && (
              <View style={styles.nextClassSpotlight}>
                <View style={styles.spotlightIcon}>
                  <Feather name="clock" size={16} color={theme.colors.primary.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={styles.spotlightCaption}>
                    NEXT CLASS TODAY &bull; {overview.nextClassToday.startTime}
                  </Text>
                  <Text variant="label" style={styles.spotlightTitle}>
                    {overview.nextClassToday.batch.name} ({overview.nextClassToday.batch.subject})
                  </Text>
                </View>
                <Button
                  title="Attendance"
                  size="sm"
                  variant="primary"
                  onPress={() =>
                    router.push(`/(teacher)/attendance/${overview.nextClassToday?.batch.id}` as any)
                  }
                />
              </View>
            )}
          </Card>
        )}

        {/* 2. Horizontal Day Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabsList}
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = day === todayDay;
            const daySlots = overview?.days.find((d) => d.day === day)?.slots.length || 0;

            return (
              <Pressable
                key={day}
                style={[styles.dayTab, isSelected && styles.dayTabSelected]}
                onPress={() => setSelectedDay(day)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    variant="label"
                    style={[styles.dayTabText, isSelected && styles.dayTabTextSelected]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </View>
                <View style={[styles.slotCountBadge, isSelected && styles.slotCountBadgeSelected]}>
                  <Text
                    style={[
                      styles.slotCountText,
                      isSelected && styles.slotCountTextSelected,
                    ]}
                  >
                    {daySlots}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 3. Day Slots Timeline */}
        <View style={styles.dayTimelineContainer}>
          <View style={styles.timelineHeader}>
            <Text variant="heading" style={styles.timelineDayTitle}>
              {selectedDay} Schedule
            </Text>
            <Text variant="caption" style={styles.timelineDaySub}>
              {currentDaySchedule?.totalClasses || 0} classes &bull;{' '}
              {Math.round(((currentDaySchedule?.totalMinutes || 0) / 60) * 10) / 10} hours
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginVertical: 40 }} />
          ) : !currentDaySchedule || currentDaySchedule.slots.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={`No classes on ${selectedDay}`}
              description="Enjoy your day off or review curriculum materials. No batches are currently scheduled for this day."
            />
          ) : (
            <View style={styles.slotsTimeline}>
              {currentDaySchedule.slots.map((slot, index) => {
                const isLast = index === currentDaySchedule.slots.length - 1;

                return (
                  <View key={slot.id} style={styles.timelineItem}>
                    {/* Time Column with Node & Vertical Line */}
                    <View style={styles.timeColumn}>
                      <Text style={styles.slotTimeText}>{slot.startTime}</Text>
                      <Text style={styles.slotEndTimeText}>{slot.endTime}</Text>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {Math.floor(slot.durationMinutes / 60)}h{' '}
                          {slot.durationMinutes % 60 > 0 ? `${slot.durationMinutes % 60}m` : ''}
                        </Text>
                      </View>
                      {!isLast && <View style={styles.timelineConnectorLine} />}
                    </View>

                    {/* Class Details Card */}
                    <Card
                      variant="elevated"
                      padding="md"
                      style={[
                        styles.slotCard,
                        slot.hasConflict && styles.slotCardConflict,
                      ]}
                    >
                      {/* Conflict Warning */}
                      {slot.hasConflict && (
                        <View style={styles.conflictBanner}>
                          <Feather name="alert-triangle" size={13} color="#DC2626" />
                          <Text style={styles.conflictText}>
                            Overlaps with: {slot.conflictWith}
                          </Text>
                        </View>
                      )}

                      <View style={styles.slotCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text variant="heading" style={styles.batchNameText}>
                            {slot.batch.name}
                          </Text>
                          <Text variant="caption" style={styles.batchSubText}>
                            {slot.batch.subject} &bull; {slot.batch.grade}
                          </Text>
                        </View>

                        <Badge
                          variant="primary"
                          size="sm"
                          label={`${slot.batch.studentCount || 0} Students`}
                        />
                      </View>

                      {/* Room & Actions Footer */}
                      <View style={styles.slotCardFooter}>
                        <View style={styles.roomBadge}>
                          <Feather name="map-pin" size={12} color="#64748B" />
                          <Text variant="caption" style={styles.roomText}>
                            {slot.batch.room || 'Classroom 1'}
                          </Text>
                        </View>

                        <View style={styles.slotActionsRow}>
                          <Pressable
                            style={styles.batchBtn}
                            onPress={() => router.push(`/(teacher)/batch/${slot.batch.id}` as any)}
                          >
                            <Text variant="caption" style={styles.batchBtnText}>
                              Details
                            </Text>
                          </Pressable>

                          <Pressable
                            style={styles.attendanceBtn}
                            onPress={() =>
                              router.push(`/(teacher)/attendance/${slot.batch.id}` as any)
                            }
                          >
                            <Feather name="check-square" size={12} color="#FFFFFF" />
                            <Text variant="caption" style={styles.attendanceBtnText}>
                              Attendance
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 14,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  summarySub: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  nextClassSpotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  spotlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  spotlightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  dayTabsList: {
    gap: 8,
    paddingVertical: 2,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
  },
  dayTabSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  dayTabTextSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  slotCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  slotCountBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  slotCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  slotCountTextSelected: {
    color: '#FFFFFF',
  },
  dayTimelineContainer: {
    gap: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timelineDayTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  timelineDaySub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  slotsTimeline: {
    gap: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    width: 72,
    alignItems: 'flex-start',
    position: 'relative',
    paddingTop: 2,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  slotEndTimeText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 6,
  },
  durationText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  timelineConnectorLine: {
    position: 'absolute',
    left: 10,
    top: 50,
    bottom: -14,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  slotCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 10,
  },
  slotCardConflict: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conflictText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  slotCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  batchNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  batchSubText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  slotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  slotActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  batchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  batchBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.main,
  },
  attendanceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
