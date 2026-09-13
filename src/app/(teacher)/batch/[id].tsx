import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import {
  Batch,
  Student,
  AttendanceRecord,
  Homework,
  Test,
} from '@/types/teacher';
import { theme } from '@/theme';

type BatchSectionTab =
  | 'overview'
  | 'students'
  | 'attendance'
  | 'homework'
  | 'tests';

const SECTION_TABS: { key: BatchSectionTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'students', label: 'Students', icon: 'users' },
  { key: 'attendance', label: 'Attendance', icon: 'check-square' },
  { key: 'homework', label: 'Homework', icon: 'book-open' },
  { key: 'tests', label: 'Tests & Marks', icon: 'award' },
];

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [testsList, setTestsList] = useState<Test[]>([]);
  const [activeTab, setActiveTab] = useState<BatchSectionTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const loadBatchData = useCallback(async () => {
    if (!id) return;
    try {
      const [batchData, studentData, attData, hwData, tData] = await Promise.all([
        teacherService.getBatchById(id),
        teacherService.getBatchStudents(id),
        teacherService.getBatchAttendanceHistory(id),
        teacherService.getBatchHomework(id),
        teacherService.getBatchTests(id),
      ]);
      setBatch(batchData);
      setStudents(studentData);
      setAttendanceHistory(attData);
      setHomeworkList(hwData);
      setTestsList(tData);
    } catch (error) {
      console.error('Failed to load batch workspace:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBatchData();
  }, [loadBatchData]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text variant="body" style={styles.loadingText}>
          Loading batch workspace...
        </Text>
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Batch Details" showBack />
        <EmptyState
          icon="alert-circle"
          title="Batch not found"
          description="The requested batch could not be located."
          actionLabel="Back to Batches"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={batch.name}
        subtitle={`${batch.grade} • ${batch.subject}`}
        showBack
      />

      {/* Section Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {SECTION_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={
                    isActive
                      ? theme.colors.primary.main
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  variant="caption"
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentScroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* OVERVIEW SECTION */}
        {activeTab === 'overview' && (
          <View style={styles.sectionStack}>
            {/* Today Status Card */}
            <Card variant="elevated" padding="md" style={styles.cardGap}>
              <Text variant="heading" style={styles.cardTitle}>
                Today's Attendance Status
              </Text>
              {batch.attendanceTakenToday ? (
                <View style={styles.statusRow}>
                  <Badge
                    label="Attendance Completed for Today"
                    variant="success"
                    icon="check-circle"
                  />
                  <Button
                    title="View / Edit"
                    variant="outline"
                    onPress={() => router.push(`/(teacher)/attendance/${batch.id}`)}
                  />
                </View>
              ) : (
                <View style={styles.statusRow}>
                  <Badge
                    label="Attendance Not Yet Marked"
                    variant="warning"
                    icon="alert-circle"
                  />
                  <Button
                    title="Mark Attendance Now"
                    variant="primary"
                    onPress={() => router.push(`/(teacher)/attendance/${batch.id}`)}
                  />
                </View>
              )}
            </Card>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <Card variant="outlined" padding="md" style={styles.statCard}>
                <Text variant="caption" style={styles.statLabel}>
                  Total Students
                </Text>
                <Text variant="title" style={styles.statNumber}>
                  {students.length}
                </Text>
              </Card>
              <Card variant="outlined" padding="md" style={styles.statCard}>
                <Text variant="caption" style={styles.statLabel}>
                  Homework Items
                </Text>
                <Text variant="title" style={styles.statNumber}>
                  {homeworkList.length}
                </Text>
              </Card>
              <Card variant="outlined" padding="md" style={styles.statCard}>
                <Text variant="caption" style={styles.statLabel}>
                  Tests Conducted
                </Text>
                <Text variant="title" style={styles.statNumber}>
                  {testsList.length}
                </Text>
              </Card>
            </View>

            {/* Recent Homework Preview */}
            <View style={styles.sectionBlock}>
              <View style={styles.blockHeader}>
                <Text variant="heading" style={styles.blockTitle}>
                  Active Homework
                </Text>
                <Pressable onPress={() => setActiveTab('homework')}>
                  <Text variant="label" style={styles.linkText}>
                    See all
                  </Text>
                </Pressable>
              </View>
              {homeworkList.length === 0 ? (
                <Text variant="caption" style={styles.emptyInlineText}>
                  No active homework assigned for this batch.
                </Text>
              ) : (
                homeworkList.slice(0, 2).map((hw) => (
                  <Card key={hw.id} variant="outlined" padding="md" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text variant="label" style={styles.itemTitle}>
                        {hw.title}
                      </Text>
                      <Badge label={`Due ${hw.dueDate}`} variant="info" size="sm" />
                    </View>
                    <Text variant="caption" numberOfLines={2} style={styles.itemDesc}>
                      {hw.description}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          </View>
        )}

        {/* STUDENTS ROSTER (Read-Only Per PRD) */}
        {activeTab === 'students' && (
          <View style={styles.sectionStack}>
            <View style={styles.blockHeader}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.titleWithBadge}>
                  <Text variant="heading" style={styles.blockTitle}>
                    Enrolled Students
                  </Text>
                  {students.length > 0 && (
                    <Badge
                      label={`${students.length}`}
                      variant="primary"
                      size="sm"
                    />
                  )}
                </View>
                <Text variant="caption" style={styles.headerSubtitle}>
                  Roster managed by Institute Owner
                </Text>
              </View>
              <Badge label="Read-Only" variant="neutral" size="sm" />
            </View>

            {students.length === 0 ? (
              <EmptyState
                icon="users"
                title="No students enrolled yet"
                description="Students will appear here once assigned by the Institute Owner."
              />
            ) : (
              <Card variant="outlined" padding="none" style={styles.tableCard}>
                {students.map((student, index) => {
                  const isLast = index === students.length - 1;
                  return (
                    <View
                      key={student.id}
                      style={[
                        styles.studentRow,
                        !isLast && styles.studentRowBorder,
                      ]}
                    >
                      <View style={styles.rollBox}>
                        <Text variant="caption" style={styles.rollText}>
                          {student.rollNumber}
                        </Text>
                      </View>
                      <View style={styles.studentInfo}>
                        <Text variant="label" style={styles.studentName}>
                          {student.name}
                        </Text>
                        {student.parentPhone && (
                          <Text variant="caption" style={styles.studentPhone}>
                            Parent: {student.parentPhone}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </View>
        )}

        {/* ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
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
                onPress={() => router.push(`/(teacher)/attendance/${batch.id}`)}
              />
            </View>

            {attendanceHistory.length === 0 ? (
              <EmptyState
                icon="check-square"
                title="No attendance records"
                description="Attendance taken for this batch will be logged here."
                actionLabel="Take Attendance"
                onAction={() => router.push(`/(teacher)/attendance/${batch.id}`)}
              />
            ) : (
              attendanceHistory.map((rec) => (
                <Card key={rec.id} variant="outlined" padding="md" style={styles.attCard}>
                  <View style={styles.attCardHeader}>
                    <View style={styles.attDateGroup}>
                      <Feather name="calendar" size={16} color={theme.colors.primary.main} />
                      <Text variant="label" style={styles.attDateText}>
                        {rec.date}
                      </Text>
                    </View>
                    <Text variant="caption" style={styles.attTotalText}>
                      Total: {rec.totalStudents}
                    </Text>
                  </View>
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
                </Card>
              ))
            )}
          </View>
        )}

        {/* HOMEWORK SECTION */}
        {activeTab === 'homework' && (
          <View style={styles.sectionStack}>
            <View style={styles.blockHeader}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.titleWithBadge}>
                  <Text variant="heading" style={styles.blockTitle}>
                    Homework
                  </Text>
                  {homeworkList.length > 0 && (
                    <Badge
                      label={`${homeworkList.length}`}
                      variant="primary"
                      size="sm"
                    />
                  )}
                </View>
                <Text variant="caption" style={styles.headerSubtitle}>
                  Assignments & submission tracking
                </Text>
              </View>
              <Button
                title="Create"
                icon="plus"
                size="sm"
                variant="primary"
                onPress={() =>
                  router.push(`/(teacher)/homework/create?batchId=${batch.id}`)
                }
              />
            </View>

            {homeworkList.length === 0 ? (
              <EmptyState
                icon="book-open"
                title="No homework yet"
                description="Assign practice exercises and homework to this batch."
                actionLabel="Create Homework"
                onAction={() =>
                  router.push(`/(teacher)/homework/create?batchId=${batch.id}`)
                }
              />
            ) : (
              homeworkList.map((hw) => {
                const total = hw.totalStudents || 1;
                const submissionRate = Math.round(((hw.submissionsCount || 0) / total) * 100);

                return (
                  <Card key={hw.id} variant="elevated" padding="md" style={styles.hwCard}>
                    <View style={styles.hwTopRow}>
                      <View style={styles.hwIconBox}>
                        <Feather name="book-open" size={16} color={theme.colors.primary.main} />
                      </View>
                      <View style={styles.hwTitleWrapper}>
                        <Text variant="heading" style={styles.hwTitle}>
                          {hw.title}
                        </Text>
                        <View style={styles.hwMetaInline}>
                          <Feather name="clock" size={11} color={theme.colors.text.disabled} />
                          <Text variant="caption" style={styles.hwCreated}>
                            Posted {hw.createdAt}
                          </Text>
                        </View>
                      </View>
                      <Badge
                        label={`Due: ${hw.dueDate}`}
                        variant="warning"
                        icon="calendar"
                        size="sm"
                      />
                    </View>

                    <Text variant="body" numberOfLines={3} style={styles.hwDesc}>
                      {hw.description}
                    </Text>

                    {/* Progress tracking */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabelRow}>
                        <Text variant="caption" style={styles.progressLabel}>
                          Submissions
                        </Text>
                        <Text variant="caption" style={styles.progressValue}>
                          {hw.submissionsCount} / {hw.totalStudents} students ({submissionRate}%)
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(submissionRate, 100)}%`,
                              backgroundColor:
                                submissionRate >= 80
                                  ? theme.colors.semantic.success.main
                                  : theme.colors.primary.main,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* TESTS & MARKS SECTION */}
        {activeTab === 'tests' && (
          <View style={styles.sectionStack}>
            <View style={styles.blockHeader}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.titleWithBadge}>
                  <Text variant="heading" style={styles.blockTitle}>
                    Tests & Marks
                  </Text>
                  {testsList.length > 0 && (
                    <Badge
                      label={`${testsList.length}`}
                      variant="primary"
                      size="sm"
                    />
                  )}
                </View>
                <Text variant="caption" style={styles.headerSubtitle}>
                  Assessments & student scoring
                </Text>
              </View>
              <Button
                title="New Test"
                icon="plus"
                size="sm"
                variant="primary"
                onPress={() =>
                  router.push(`/(teacher)/tests/create?batchId=${batch.id}`)
                }
              />
            </View>

            {testsList.length === 0 ? (
              <EmptyState
                icon="award"
                title="No tests recorded"
                description="Create assessments and enter marks for students in this batch."
                actionLabel="Create Test"
                onAction={() =>
                  router.push(`/(teacher)/tests/create?batchId=${batch.id}`)
                }
              />
            ) : (
              testsList.map((test) => (
                <Card key={test.id} variant="elevated" padding="md" style={styles.testCard}>
                  <View style={styles.testHeader}>
                    <View style={styles.testTitleCol}>
                      <Text variant="heading" style={styles.testTitle}>
                        {test.title}
                      </Text>
                      <Text variant="caption" style={styles.testDate}>
                        Date: {test.date} • Max Marks: {test.maxMarks}
                      </Text>
                    </View>
                    <Badge
                      label={`${test.submittedCount}/${test.totalStudents} Entered`}
                      variant={
                        test.submittedCount === test.totalStudents
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    />
                  </View>

                  <View style={styles.testActionRow}>
                    <Button
                      title="Enter / Edit Marks →"
                      variant="primary"
                      fullWidth
                      onPress={() =>
                        router.push(`/(teacher)/tests/${test.id}/marks`)
                      }
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  tabsContainer: {
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  tabsScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  tabButtonTextActive: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  contentScroll: {
    padding: theme.spacing.lg,
  },
  sectionStack: {
    gap: theme.spacing.lg,
  },
  cardGap: {
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statNumber: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.sizes.xl,
  },
  sectionBlock: {
    gap: theme.spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
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
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
  },
  linkText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  emptyInlineText: {
    color: theme.colors.text.secondary,
  },
  itemCard: {
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: theme.colors.text.primary,
  },
  itemDesc: {
    color: theme.colors.text.secondary,
  },
  tableCard: {
    overflow: 'hidden',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  studentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  rollBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollText: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: theme.colors.text.primary,
  },
  studentPhone: {
    color: theme.colors.text.secondary,
  },
  attCard: {
    gap: theme.spacing.sm,
  },
  attCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attDateText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  attTotalText: {
    color: theme.colors.text.secondary,
  },
  attStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  hwCard: {
    gap: theme.spacing.md,
  },
  hwTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  hwIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwTitleWrapper: {
    flex: 1,
    gap: 2,
  },
  hwTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  hwMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hwCreated: {
    color: theme.colors.text.disabled,
    fontSize: theme.typography.sizes.xs,
  },
  hwDesc: {
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  progressSection: {
    gap: 6,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    fontSize: theme.typography.sizes.xs,
  },
  progressValue: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.xs,
  },
  progressBarBg: {
    height: 6,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.radii.full,
  },
  testCard: {
    gap: theme.spacing.md,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  testTitleCol: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.sm,
  },
  testTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  testDate: {
    color: theme.colors.text.secondary,
  },
  testActionRow: {
    marginTop: 2,
  },
});
