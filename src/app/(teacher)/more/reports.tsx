import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { Batch, Test, Homework, Student } from '@/types/teacher';
import { theme } from '@/theme';

interface EnrolledStudentItem extends Student {
  batchId: string;
  batchName: string;
  batchSubject: string;
  batchGrade: string;
}

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TeacherReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [allStudents, setAllStudents] = useState<EnrolledStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Directory Modal State
  const [isStudentsModalVisible, setIsStudentsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');

  useEffect(() => {
    async function loadReportData() {
      try {
        const [b, t, h] = await Promise.all([
          teacherService.getBatches(),
          teacherService.getTestsList(),
          teacherService.getHomeworkList(),
        ]);
        setBatches(b);
        setTests(t);
        setHomework(h);

        // Fetch students for all batches
        const enrolled: EnrolledStudentItem[] = [];
        for (const batch of b) {
          const students = await teacherService.getBatchStudents(batch.id);
          for (const s of students) {
            enrolled.push({
              ...s,
              batchId: batch.id,
              batchName: batch.name,
              batchSubject: batch.subject,
              batchGrade: batch.grade,
            });
          }
        }
        setAllStudents(enrolled);
      } catch (error) {
        console.error('Failed to load report data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportData();
  }, []);

  const totalStudents = allStudents.length;
  const totalSubmissions = homework.reduce((sum, h) => sum + h.submissionsCount, 0);
  const totalAssignedHw = homework.reduce((sum, h) => sum + h.totalStudents, 0);
  const hwCompletionRate =
    totalAssignedHw > 0 ? Math.round((totalSubmissions / totalAssignedHw) * 100) : 0;

  // Filter students based on search query and batch filter
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchBatch =
        selectedBatchFilter === 'all' || s.batchId === selectedBatchFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.batchName.toLowerCase().includes(q) ||
        s.batchSubject.toLowerCase().includes(q);

      return matchBatch && matchQuery;
    });
  }, [allStudents, selectedBatchFilter, searchQuery]);

  const handleCallParent = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'No parent phone number provided for this student.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call.');
    });
  };

  const handleOpenStudentProfile = (student: EnrolledStudentItem) => {
    setIsStudentsModalVisible(false);
    router.push({
      pathname: '/(teacher)/student/[id]',
      params: { id: student.id, batchId: student.batchId },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Teaching Reports"
        subtitle="Attendance trends & student academic progress"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="body" style={styles.loadingText}>
              Aggregating teaching insights...
            </Text>
          </View>
        ) : (
          <>
            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Pressable Total Students Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.metricCardWrapper,
                  pressed && styles.metricCardPressed,
                ]}
                onPress={() => setIsStudentsModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="View all enrolled students"
              >
                <Card variant="elevated" padding="md" style={styles.metricCard}>
                  <View style={styles.metricIconBox}>
                    <Feather name="users" size={18} color={theme.colors.primary.main} />
                  </View>
                  <Text variant="title" style={styles.metricValue}>
                    {totalStudents}
                  </Text>
                  <Text variant="caption" style={styles.metricLabel}>
                    Total Students
                  </Text>
                  <View style={styles.metricHintRow}>
                    <Text variant="caption" style={styles.metricHintText}>
                      View List
                    </Text>
                    <Feather name="chevron-right" size={12} color={theme.colors.primary.main} />
                  </View>
                </Card>
              </Pressable>

              <View style={styles.metricCardWrapper}>
                <Card variant="elevated" padding="md" style={styles.metricCard}>
                  <View
                    style={[
                      styles.metricIconBox,
                      { backgroundColor: theme.colors.semantic.success.bg },
                    ]}
                  >
                    <Feather
                      name="check-circle"
                      size={18}
                      color={theme.colors.semantic.success.main}
                    />
                  </View>
                  <Text variant="title" style={styles.metricValue}>
                    94%
                  </Text>
                  <Text variant="caption" style={styles.metricLabel}>
                    Avg Attendance
                  </Text>
                  <Text variant="caption" style={styles.metricSubInfo}>
                    All Batches
                  </Text>
                </Card>
              </View>

              <View style={styles.metricCardWrapper}>
                <Card variant="elevated" padding="md" style={styles.metricCard}>
                  <View
                    style={[
                      styles.metricIconBox,
                      { backgroundColor: theme.colors.semantic.info.bg },
                    ]}
                  >
                    <Feather
                      name="book-open"
                      size={18}
                      color={theme.colors.semantic.info.main}
                    />
                  </View>
                  <Text variant="title" style={styles.metricValue}>
                    {hwCompletionRate}%
                  </Text>
                  <Text variant="caption" style={styles.metricLabel}>
                    HW Rate
                  </Text>
                  <Text variant="caption" style={styles.metricSubInfo}>
                    {totalSubmissions} Done
                  </Text>
                </Card>
              </View>
            </View>

            {/* Quick Students Banner Shortcut */}
            <Pressable
              style={({ pressed }) => [
                styles.studentsBannerCard,
                pressed && styles.studentsBannerPressed,
              ]}
              onPress={() => setIsStudentsModalVisible(true)}
            >
              <View style={styles.studentsBannerLeft}>
                <View style={styles.studentsBannerIcon}>
                  <Feather name="user-check" size={20} color={theme.colors.primary.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={styles.studentsBannerTitle}>
                    Student Directory ({totalStudents} Students)
                  </Text>
                  <Text variant="caption" style={styles.studentsBannerSub}>
                    Tap to view and search all students across your {batches.length} batches
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
            </Pressable>

            {/* Batch Performance Breakdown */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Batch Attendance Summary
              </Text>
              <View style={styles.batchList}>
                {batches.map((batch) => (
                  <Card key={batch.id} variant="outlined" padding="md" style={styles.batchReportCard}>
                    <Pressable
                      style={styles.batchReportPressable}
                      onPress={() => router.push(`/(teacher)/batch/${batch.id}`)}
                    >
                      <View style={styles.batchReportHeader}>
                        <View style={styles.batchInfo}>
                          <Text variant="label" style={styles.batchSubject}>
                            {batch.name} • {batch.subject}
                          </Text>
                          <Text variant="caption" style={styles.batchGrade}>
                            {batch.grade} • {batch.studentCount} Students
                          </Text>
                        </View>
                        <Badge label="95% Present" variant="success" size="sm" />
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '95%' }]} />
                      </View>
                    </Pressable>
                  </Card>
                ))}
              </View>
            </View>

            {/* Recent Assessments Summary */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Assessment Performance
              </Text>
              <View style={styles.testList}>
                {tests.map((test) => (
                  <Card key={test.id} variant="outlined" padding="md" style={styles.testReportCard}>
                    <View style={styles.testReportHeader}>
                      <View style={styles.testInfo}>
                        <Text variant="label" style={styles.testTitle}>
                          {test.title}
                        </Text>
                        <Text variant="caption" style={styles.testBatch}>
                          {test.batchName} • Max {test.maxMarks} Marks • Date: {test.date}
                        </Text>
                      </View>
                      <Badge
                        label={`${test.submittedCount}/${test.totalStudents} Graded`}
                        variant={test.submittedCount === test.totalStudents ? 'success' : 'warning'}
                        size="sm"
                      />
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ALL ENROLLED STUDENTS DIRECTORY MODAL */}
      <Modal
        visible={isStudentsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStudentsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setIsStudentsModalVisible(false)}
          />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Sheet Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={styles.modalTitle}>
                  Enrolled Students Directory
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  {filteredStudents.length} of {totalStudents} Students across {batches.length} batches
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.modalCloseBtn}
                onPress={() => setIsStudentsModalVisible(false)}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Input
                placeholder="Search by student name, roll no, batch..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftContent={
                  <Feather name="search" size={16} color={theme.colors.text.secondary} />
                }
                rightContent={
                  searchQuery.length > 0 ? (
                    <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
                      <Feather name="x-circle" size={16} color={theme.colors.text.disabled} />
                    </Pressable>
                  ) : null
                }
              />
            </View>

            {/* Batch Filter Chips */}
            <View style={styles.filterChipsRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContent}
              >
                <Pressable
                  style={[
                    styles.filterChip,
                    selectedBatchFilter === 'all' && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedBatchFilter('all')}
                >
                  <Text
                    variant="caption"
                    style={[
                      styles.filterChipText,
                      selectedBatchFilter === 'all' && styles.filterChipTextActive,
                    ]}
                  >
                    All Batches ({totalStudents})
                  </Text>
                </Pressable>

                {batches.map((b) => {
                  const count = allStudents.filter((s) => s.batchId === b.id).length;
                  const isSelected = selectedBatchFilter === b.id;
                  return (
                    <Pressable
                      key={b.id}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedBatchFilter(b.id)}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {b.subject} ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <EmptyState
                  icon="users"
                  title="No students matched"
                  description={
                    searchQuery
                      ? `No students found matching "${searchQuery}".`
                      : 'No students enrolled in this batch yet.'
                  }
                  actionLabel={searchQuery ? 'Clear Search' : undefined}
                  onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.studentsListScroll}
                keyboardShouldPersistTaps="handled"
              >
                {filteredStudents.map((student) => (
                  <Card
                    key={`${student.batchId}-${student.id}`}
                    variant="outlined"
                    padding="none"
                    style={styles.studentRosterCard}
                  >
                    <Pressable
                      style={styles.studentRosterPressable}
                      onPress={() => handleOpenStudentProfile(student)}
                    >
                      {/* Avatar */}
                      <View style={styles.studentAvatar}>
                        <Text variant="label" style={styles.studentAvatarText}>
                          {getInitials(student.name)}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={styles.studentMainInfo}>
                        <View style={styles.studentTitleRow}>
                          <Text variant="label" style={styles.studentFullName}>
                            {student.name}
                          </Text>
                          <Badge
                            label={`Roll #${student.rollNumber}`}
                            variant="neutral"
                            size="sm"
                          />
                        </View>

                        <View style={styles.studentMetaLine}>
                          <Badge
                            label={`${student.batchName} • ${student.batchGrade}`}
                            variant="primary"
                            size="sm"
                          />
                        </View>
                      </View>

                      {/* Call Button & Chevron */}
                      <View style={styles.studentActionsGroup}>
                        {student.parentPhone ? (
                          <Pressable
                            hitSlop={8}
                            style={styles.quickCallBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleCallParent(student.parentPhone);
                            }}
                          >
                            <Feather
                              name="phone"
                              size={14}
                              color={theme.colors.semantic.success.main}
                            />
                          </Pressable>
                        ) : null}
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={theme.colors.text.disabled}
                        />
                      </View>
                    </Pressable>
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    padding: theme.spacing.lg,
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
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  metricCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 2,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  metricHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  metricHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  metricSubInfo: {
    fontSize: 10,
    color: theme.colors.text.disabled,
    marginTop: 2,
  },

  // Students shortcut banner
  studentsBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentsBannerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  studentsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentsBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentsBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  studentsBannerSub: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },

  // Batch section
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    fontWeight: '700',
  },
  batchList: {
    gap: theme.spacing.sm,
  },
  batchReportCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
  },
  batchReportPressable: {
    gap: theme.spacing.sm,
  },
  batchReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchInfo: {
    gap: 2,
  },
  batchSubject: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  batchGrade: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.semantic.success.main,
    borderRadius: 3,
  },

  // Tests
  testList: {
    gap: theme.spacing.sm,
  },
  testReportCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    gap: 4,
  },
  testReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testInfo: {
    gap: 2,
  },
  testTitle: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  testBatch: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },

  // Modal Sheet
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
    maxHeight: '90%',
    paddingTop: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  searchWrap: {
    paddingHorizontal: 20,
  },
  filterChipsRow: {
    maxHeight: 36,
  },
  filterChipsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  modalEmptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  studentsListScroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 8,
  },
  studentRosterCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  studentRosterPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: theme.colors.primary.main,
    fontSize: 13,
    fontWeight: '700',
  },
  studentMainInfo: {
    flex: 1,
    gap: 4,
  },
  studentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  studentMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.success.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
