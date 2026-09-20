import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EnrolledStudentsModal, EnrolledStudentItem } from '@/components/reports';
import { teacherService } from '@/services/teacher.service';
import { Batch, Test, Homework } from '@/types/teacher';
import { theme } from '@/theme';

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
                  <Feather name="users" size={20} color={theme.colors.primary.main} />
                </View>
                <View>
                  <Text variant="label" style={styles.studentsBannerTitle}>
                    Enrolled Students Directory
                  </Text>
                  <Text variant="caption" style={styles.studentsBannerSub}>
                    Browse, search & view all {totalStudents} students across all batches
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.primary.main} />
            </Pressable>

            {/* Attendance Performance per Batch */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Attendance by Batch
              </Text>

              <View style={styles.batchList}>
                {batches.map((b) => (
                  <Card key={b.id} variant="outlined" padding="md" style={styles.batchReportCard}>
                    <Pressable
                      style={styles.batchReportPressable}
                      onPress={() => router.push(`/(teacher)/batch/${b.id}`)}
                    >
                      <View style={styles.batchReportHeader}>
                        <View style={styles.batchInfo}>
                          <Text variant="label" style={styles.batchSubject}>
                            {b.name}
                          </Text>
                          <Text variant="caption" style={styles.batchGrade}>
                            {b.grade} • {b.studentCount} Students enrolled
                          </Text>
                        </View>
                        <Badge label="94% Rate" variant="success" size="sm" />
                      </View>

                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '94%' }]} />
                      </View>
                    </Pressable>
                  </Card>
                ))}
              </View>
            </View>

            {/* Recent Assessment Performance */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Recent Tests & Assessments
              </Text>

              <View style={styles.testList}>
                {tests.map((t) => (
                  <Card key={t.id} variant="outlined" padding="md" style={styles.testReportCard}>
                    <View style={styles.testReportHeader}>
                      <View style={styles.testInfo}>
                        <Text variant="label" style={styles.testTitle}>
                          {t.title}
                        </Text>
                        <Text variant="caption" style={styles.testBatch}>
                          {t.batchName} • Date: {t.date}
                        </Text>
                      </View>
                      <Badge label={`Max ${t.maxMarks} Marks`} variant="neutral" size="sm" />
                    </View>

                    <Button
                      title="View / Enter Marks →"
                      variant="outline"
                      size="sm"
                      onPress={() => router.push(`/(teacher)/tests/${t.id}/marks`)}
                    />
                  </Card>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modular Enrolled Students Modal */}
      <EnrolledStudentsModal
        visible={isStudentsModalVisible}
        onClose={() => setIsStudentsModalVisible(false)}
        batches={batches}
        allStudents={allStudents}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        selectedBatchFilter={selectedBatchFilter}
        onSelectBatchFilter={setSelectedBatchFilter}
        onCallParent={handleCallParent}
        onSelectStudent={handleOpenStudentProfile}
      />
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
  testList: {
    gap: theme.spacing.sm,
  },
  testReportCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    gap: 8,
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
});
