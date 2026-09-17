import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
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
import { Batch, StudentAttendanceItem, AttendanceStatus } from '@/types/teacher';
import { theme } from '@/theme';

import { SuccessModal } from '@/components/ui/SuccessModal';

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TakeAttendanceScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [items, setItems] = useState<StudentAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!batchId) return;
    try {
      const [batchData, studentsData] = await Promise.all([
        teacherService.getBatchById(batchId),
        teacherService.getBatchStudents(batchId),
      ]);
      setBatch(batchData);

      // Default all students to 'present' for ultra-fast attendance completion
      const initialItems: StudentAttendanceItem[] = studentsData.map((st) => ({
        studentId: st.id,
        studentName: st.name,
        rollNumber: st.rollNumber,
        status: 'present',
      }));
      setItems(initialItems);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = (studentId: string, newStatus: AttendanceStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item,
      ),
    );
  };

  const handleMarkAllPresent = () => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, status: 'present' })),
    );
  };

  const handleMarkAllAbsent = () => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, status: 'absent' })),
    );
  };

  const presentCount = items.filter((i) => i.status === 'present').length;
  const absentCount = items.filter((i) => i.status === 'absent').length;

  const handleSubmit = async () => {
    if (!batchId || items.length === 0 || !batch) return;

    setIsSubmitting(true);
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      await teacherService.submitAttendance(batchId, todayIso, items);
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert(
        'Submission Failed',
        'Could not save attendance records. Please check your network and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalVisible(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(teacher)/(tabs)');
    }
  };

  const handleViewBatchDetails = () => {
    setIsSuccessModalVisible(false);
    if (batchId) {
      router.replace(`/(teacher)/batch/${batchId}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(teacher)/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text variant="body" style={styles.loadingText}>
          Preparing attendance sheet...
        </Text>
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Take Attendance" showBack />
        <EmptyState
          icon="alert-circle"
          title="Batch not found"
          description="Unable to find student roster for this batch."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Record Attendance"
        subtitle={`${batch.name} • ${batch.grade} • ${batch.subject}`}
        showBack
      />

      {/* Date & Quick Action Banner */}
      <View style={styles.banner}>
        <View style={styles.dateRow}>
          <View style={styles.dateTextGroup}>
            <Text variant="label" style={styles.dateLabel}>
              {formatTodayDate()}
            </Text>
            <Text variant="caption" style={styles.batchTime}>
              {batch.timing} • {items.length} Students Enrolled
            </Text>
          </View>
          <View style={styles.summaryBadges}>
            <Badge
              label={`${presentCount} Present`}
              variant="success"
              size="sm"
            />
            <Badge
              label={`${absentCount} Absent`}
              variant={absentCount > 0 ? 'danger' : 'neutral'}
              size="sm"
            />
          </View>
        </View>

        {/* 1-Tap Quick Action Buttons */}
        <View style={styles.fastActionRow}>
          <Pressable
            style={styles.fastActionButton}
            onPress={handleMarkAllPresent}
          >
            <Feather
              name="check-circle"
              size={16}
              color={theme.colors.semantic.success.main}
            />
            <Text variant="caption" style={styles.fastActionTextSuccess}>
              Mark All Present
            </Text>
          </Pressable>

          <Pressable
            style={styles.fastActionButton}
            onPress={handleMarkAllAbsent}
          >
            <Feather
              name="x-circle"
              size={16}
              color={theme.colors.semantic.danger.main}
            />
            <Text variant="caption" style={styles.fastActionTextDanger}>
              Mark All Absent
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Student List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {items.length === 0 ? (
          <EmptyState
            icon="users"
            title="No students enrolled yet"
            description="Students will appear here once assigned to this batch by the institute owner."
            actionLabel="Back to Batch"
            onAction={() => router.back()}
          />
        ) : (
          <Card variant="outlined" padding="none" style={styles.rosterCard}>
            {items.map((student, index) => {
              const isLast = index === items.length - 1;
              const isPresent = student.status === 'present';
              const isAbsent = student.status === 'absent';

            return (
              <View
                key={student.studentId}
                style={[
                  styles.studentRow,
                  !isLast && styles.studentRowBorder,
                  isAbsent && styles.studentRowAbsent,
                ]}
              >
                {/* Roll & Name */}
                <View style={styles.studentInfoGroup}>
                  <View
                    style={[
                      styles.rollBadge,
                      isAbsent && styles.rollBadgeAbsent,
                    ]}
                  >
                    <Text variant="caption" style={styles.rollNumber}>
                      {student.rollNumber}
                    </Text>
                  </View>
                  <View style={styles.nameBlock}>
                    <Text variant="label" style={styles.studentName}>
                      {student.studentName}
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.statusIndicatorText,
                        isPresent
                          ? styles.statusTextPresent
                          : styles.statusTextAbsent,
                      ]}
                    >
                      {isPresent ? 'Marked Present' : 'Marked Absent'}
                    </Text>
                  </View>
                </View>

                {/* Present / Absent Toggle Buttons */}
                <View style={styles.toggleButtonGroup}>
                  <Pressable
                    style={[
                      styles.togglePill,
                      styles.presentPill,
                      isPresent && styles.presentPillActive,
                    ]}
                    onPress={() =>
                      handleToggleStatus(student.studentId, 'present')
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${student.studentName} Present`}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.toggleText,
                        isPresent && styles.toggleTextActive,
                      ]}
                    >
                      Present
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.togglePill,
                      styles.absentPill,
                      isAbsent && styles.absentPillActive,
                    ]}
                    onPress={() =>
                      handleToggleStatus(student.studentId, 'absent')
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${student.studentName} Absent`}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.toggleText,
                        isAbsent && styles.toggleTextActive,
                      ]}
                    >
                      Absent
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>
        )}
      </ScrollView>

      {/* Floating Bottom Submission Bar */}
      <View
        style={[
          styles.submitBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : theme.spacing.md },
        ]}
      >
        <View style={styles.submitMeta}>
          <Text variant="label" style={styles.submitSummaryText}>
            {presentCount} of {items.length} Present
          </Text>
          <Text variant="caption" style={styles.submitSubtitle}>
            {absentCount === 0 ? 'Full class present' : `${absentCount} absent today`}
          </Text>
        </View>
        <Button
          title="Submit Attendance"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </View>

      {/* Attendance Recorded Success Modal */}
      <SuccessModal
        visible={isSuccessModalVisible}
        onClose={handleSuccessClose}
        title="Attendance Recorded!"
        subtitle={
          absentCount === 0 && items.length > 0
            ? 'All enrolled students are present today. Outstanding!'
            : 'Daily attendance roster has been successfully logged.'
        }
        badgeVariant="success"
        contextBadge={
          batch
            ? {
                icon: 'book-open',
                label: `${batch.name} • ${batch.grade} • ${batch.subject}`,
              }
            : undefined
        }
        stats={[
          { label: 'Total', value: items.length, variant: 'neutral' },
          {
            label: 'Present',
            value: presentCount,
            variant: 'success',
            icon: 'check-circle',
          },
          {
            label: 'Absent',
            value: absentCount,
            variant: 'danger',
            icon: 'x-circle',
          },
        ]}
        progress={{
          label: 'Class Turnout Rate',
          percentage: items.length > 0 ? Math.round((presentCount / items.length) * 100) : 0,
        }}
        primaryAction={{
          title: 'Done',
          onPress: handleSuccessClose,
        }}
        secondaryAction={{
          title: 'View Batch Details',
          onPress: handleViewBatchDetails,
          variant: 'ghost',
        }}
      />
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
  banner: {
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    gap: theme.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextGroup: {
    gap: 2,
  },
  dateLabel: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
  },
  batchTime: {
    color: theme.colors.text.secondary,
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  fastActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  fastActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  fastActionTextSuccess: {
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.weights.semibold,
  },
  fastActionTextDanger: {
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.semibold,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  rosterCard: {
    overflow: 'hidden',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
  },
  studentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  studentRowAbsent: {
    backgroundColor: '#FFF8F8',
  },
  studentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rollBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollBadgeAbsent: {
    backgroundColor: theme.colors.semantic.danger.bg,
  },
  rollNumber: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: theme.colors.text.primary,
  },
  statusIndicatorText: {
    fontSize: 11,
  },
  statusTextPresent: {
    color: theme.colors.semantic.success.main,
  },
  statusTextAbsent: {
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.semibold,
  },
  toggleButtonGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: theme.radii.md,
    padding: 2,
    gap: 2,
  },
  togglePill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  presentPill: {},
  presentPillActive: {
    backgroundColor: theme.colors.semantic.success.main,
  },
  absentPill: {},
  absentPillActive: {
    backgroundColor: theme.colors.semantic.danger.main,
  },
  toggleText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
  },
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  submitMeta: {
    flex: 1,
    gap: 2,
  },
  submitSummaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  submitSubtitle: {
    color: theme.colors.text.secondary,
  },
  submitButton: {
    minWidth: 160,
  },
});
