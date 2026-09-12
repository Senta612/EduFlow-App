import React, { useCallback, useEffect, useState } from 'react';
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
import { teacherService } from '@/services/teacher.service';
import { Batch, Test } from '@/types/teacher';
import { theme } from '@/theme';

function formatCurrentDate(): string {
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

export default function TeacherHomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [classes, setClasses] = useState<Batch[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [todayClasses, tests] = await Promise.all([
        teacherService.getTodayClasses(),
        teacherService.getTestsList(),
      ]);
      setClasses(todayClasses);
      setUpcomingTests(tests);
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

  const pendingAttendanceCount = classes.filter(
    (c) => !c.attendanceTakenToday,
  ).length;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="caption" style={styles.greetingSub}>
            {formatCurrentDate()}
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
            {/* Today's Classes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text variant="heading" style={styles.sectionTitle}>
                    Today's Classes
                  </Text>
                  <Badge
                    label={`${classes.length} Classes`}
                    variant="primary"
                    size="sm"
                  />
                </View>
                <Pressable onPress={() => router.push('/(teacher)/(tabs)/batches')}>
                  <Text variant="label" style={styles.seeAllLink}>
                    View All
                  </Text>
                </Pressable>
              </View>

              {classes.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="No classes scheduled today"
                  description="You have no classes lined up for today. Enjoy your day!"
                />
              ) : (
                <View style={styles.classList}>
                  {classes.map((cls) => {
                    const isAttendancePending = !cls.attendanceTakenToday;

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
                              {cls.subject}
                            </Text>
                            <Text variant="body" style={styles.classGrade}>
                              {cls.grade} • {cls.name}
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
                              label="Attendance Done"
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

            {/* Quick Actions Section */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Quick Actions
              </Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={styles.quickActionCard}
                  onPress={() => {
                    const firstPending =
                      classes.find((c) => !c.attendanceTakenToday) ?? classes[0];
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
                      size={24}
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
                      size={24}
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
                      size={24}
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

            {/* Upcoming Tests / Events */}
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
                  {upcomingTests.map((test) => (
                    <Card
                      key={test.id}
                      variant="outlined"
                      padding="md"
                      style={styles.upcomingCard}
                      onPress={() =>
                        router.push(`/(teacher)/tests/${test.id}/marks`)
                      }
                    >
                      <View style={styles.upcomingLeft}>
                        <View style={styles.upcomingIconBox}>
                          <Feather
                            name="file-text"
                            size={18}
                            color={theme.colors.primary.main}
                          />
                        </View>
                        <View style={styles.upcomingMeta}>
                          <Text variant="label" style={styles.upcomingTitle}>
                            {test.title}
                          </Text>
                          <Text variant="caption" style={styles.upcomingSub}>
                            {test.batchName} • Date: {test.date}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.upcomingRight}>
                        <Badge
                          label={`Max: ${test.maxMarks}m`}
                          variant="neutral"
                          size="sm"
                        />
                        <Text variant="caption" style={styles.enterMarksHint}>
                          Enter Marks →
                        </Text>
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
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    gap: 2,
  },
  greetingSub: {
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.xl,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.semantic.warning.main,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.xl,
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
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg,
  },
  seeAllLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  classList: {
    gap: theme.spacing.md,
  },
  classCard: {
    gap: theme.spacing.md,
  },
  classCardPending: {
    borderColor: '#FED7AA',
    borderWidth: 1.5,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  classTitleGroup: {
    gap: 2,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  classSubject: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.primary,
  },
  classGrade: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
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
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 4,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  quickActionSub: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  upcomingList: {
    gap: theme.spacing.sm,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  upcomingIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingMeta: {
    flex: 1,
    gap: 2,
  },
  upcomingTitle: {
    color: theme.colors.text.primary,
  },
  upcomingSub: {
    color: theme.colors.text.secondary,
  },
  upcomingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  enterMarksHint: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
});
