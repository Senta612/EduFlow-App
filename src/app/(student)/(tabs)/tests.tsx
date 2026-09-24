import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StudentTestCard } from '@/components/student-portal';
import { StudentService } from '@/services/student.service';
import { StudentTestResultView } from '@/types/student';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function StudentTestsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [tests, setTests] = useState<StudentTestResultView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await StudentService.getTestResults(profile?.id);
      setTests(data);
    } catch (err) {
      console.error('Failed to load student tests:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Calculate aggregated performance
  const totalAttempted = tests.length;
  const avgPercentage =
    totalAttempted > 0
      ? Math.round(tests.reduce((acc, t) => acc + (t.percentage || 0), 0) / totalAttempted)
      : 0;
  const bestScore = tests.reduce(
    (max, t) => (t.marksObtained && t.marksObtained > max ? t.marksObtained : max),
    0
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Tests & Results"
        subtitle="Performance analytics & grade marksheets"
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading test results...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.main]}
              tintColor={theme.colors.primary.main}
            />
          }
        >
          {/* Performance Hero Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroTitle}>Academic Scorecard</Text>
                <Text style={styles.heroSubtitle}>Mathematics • Class 10 - Alpha</Text>
              </View>

              <View style={styles.rankBadge}>
                <Feather name="award" size={14} color="#ffffff" />
                <Text style={styles.rankBadgeText}>Rank #3</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average Score</Text>
                <Text style={styles.statValue}>{avgPercentage}%</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tests Taken</Text>
                <Text style={styles.statValue}>{totalAttempted}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Best Score</Text>
                <Text style={styles.statValue}>{bestScore}</Text>
              </View>
            </View>
          </View>

          {/* Test List Section */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeading}>Past Test Results</Text>
            <Text style={styles.testCount}>{tests.length} Recorded</Text>
          </View>

          {tests.length > 0 ? (
            tests.map((test) => (
              <StudentTestCard key={test.id} test={test} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="award" size={32} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No test records available</Text>
              <Text style={styles.emptySubtitle}>
                Your marks and test grades will appear here once submitted by your teacher.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  heroCard: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
