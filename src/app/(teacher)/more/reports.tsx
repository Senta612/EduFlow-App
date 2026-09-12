import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { Batch, Test, Homework } from '@/types/teacher';
import { theme } from '@/theme';

export default function TeacherReportsScreen() {
  const insets = useSafeAreaInsets();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error('Failed to load report data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportData();
  }, []);

  const totalStudents = batches.reduce((sum, b) => sum + b.studentCount, 0);
  const totalSubmissions = homework.reduce((sum, h) => sum + h.submissionsCount, 0);
  const totalAssignedHw = homework.reduce((sum, h) => sum + h.totalStudents, 0);
  const hwCompletionRate = totalAssignedHw > 0 ? Math.round((totalSubmissions / totalAssignedHw) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
              </Card>

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
              </Card>

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
                  HW Submission
                </Text>
              </Card>
            </View>

            {/* Batch Performance Breakdown */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                Batch Attendance Summary
              </Text>
              <View style={styles.batchList}>
                {batches.map((batch) => (
                  <Card key={batch.id} variant="outlined" padding="md" style={styles.batchReportCard}>
                    <View style={styles.batchReportHeader}>
                      <View style={styles.batchInfo}>
                        <Text variant="label" style={styles.batchSubject}>
                          {batch.subject}
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
                          {test.batchName} • Max {test.maxMarks}m
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
    </View>
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
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
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
    fontSize: theme.typography.sizes.xl,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  batchList: {
    gap: theme.spacing.sm,
  },
  batchReportCard: {
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
  },
  batchGrade: {
    color: theme.colors.text.secondary,
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
  },
  testBatch: {
    color: theme.colors.text.secondary,
  },
});
