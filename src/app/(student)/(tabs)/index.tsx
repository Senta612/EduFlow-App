import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import {
  StudentHeader,
  NextClassHeroCard,
  StudentMetricCard,
  StudentFeeModal,
} from '@/components/student-portal';
import { StudentService } from '@/services/student.service';
import { StudentDashboardSummary, StudentFeePortalView } from '@/types/student';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export default function StudentDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();

  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [feeData, setFeeData] = useState<StudentFeePortalView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFeeModalVisible, setIsFeeModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashData, fData] = await Promise.all([
        StudentService.getDashboardSummary(profile?.id),
        StudentService.getFeePortalDetails(profile?.id),
      ]);
      setSummary(dashData);
      setFeeData(fData);
    } catch (err) {
      console.error('Failed to load student dashboard summary:', err);
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

  if (isLoading && !summary) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading student dashboard...</Text>
      </View>
    );
  }

  const studentDisplayName = profile?.full_name || summary?.studentName || 'Student';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StudentHeader
        studentName={studentDisplayName}
        rollNumber={summary?.rollNumber}
        batchName={summary?.enrolledBatch?.name}
        onProfilePress={() => router.push('/(student)/(tabs)/profile')}
        onRefreshPress={handleRefresh}
        isRefreshing={isRefreshing}
      />

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
        {/* Next Class Hero Card */}
        <View style={styles.section}>
          <NextClassHeroCard
            nextClass={summary?.nextClass}
            onPress={() => router.push('/(student)/(tabs)/profile')}
          />
        </View>

        {/* Quick Fee Reminder Banner (if fee is pending/overdue) */}
        {feeData && feeData.isEnabled && feeData.dueAmount > 0 ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.feeBannerCard}
              onPress={() => setIsFeeModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.feeBannerLeft}>
                <View
                  style={[
                    styles.feeBannerIconCircle,
                    {
                      backgroundColor:
                        feeData.feeStatus === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                    },
                  ]}
                >
                  <Feather
                    name="credit-card"
                    size={18}
                    color={
                      feeData.feeStatus === 'overdue'
                        ? theme.colors.semantic.danger.main
                        : '#D97706'
                    }
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.feeBannerTitle}>
                      Tuition Fee Due • ₹{feeData.dueAmount.toLocaleString()}
                    </Text>
                    <Badge
                      label={feeData.feeStatus === 'overdue' ? 'OVERDUE' : 'DUE'}
                      variant={feeData.feeStatus === 'overdue' ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.feeBannerSub}>
                    {feeData.forMonth} • Pay via UPI or download receipts
                  </Text>
                </View>
              </View>

              <View style={styles.feeBannerPayBtn}>
                <Text style={styles.feeBannerPayText}>Pay</Text>
                <Feather name="arrow-right" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Metrics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your Progress</Text>
          <View style={styles.metricsGrid}>
            <StudentMetricCard
              label="Attendance"
              value={`${summary?.stats.attendancePercentage ?? 0}%`}
              subtitle={`${summary?.stats.presentClasses ?? 0}/${summary?.stats.totalClasses ?? 0} Classes`}
              iconName="check-circle"
              colorVariant="success"
              onPress={() => router.push('/(student)/(tabs)/profile')}
            />

            <StudentMetricCard
              label="Pending HW"
              value={summary?.stats.pendingHomeworkCount ?? 0}
              subtitle="Tasks Due"
              iconName="book-open"
              colorVariant={summary?.stats.pendingHomeworkCount ? 'warning' : 'primary'}
              onPress={() => router.push('/(student)/(tabs)/homework')}
            />
          </View>

          <View style={[styles.metricsGrid, { marginTop: theme.spacing.sm }]}>
            <StudentMetricCard
              label="Test Average"
              value={`${summary?.stats.averageTestPercentage ?? 0}%`}
              subtitle={`${summary?.stats.testsTaken ?? 0} Tests Attempted`}
              iconName="award"
              colorVariant="primary"
              onPress={() => router.push('/(student)/(tabs)/tests')}
            />

            <StudentMetricCard
              label="Class Rank"
              value={`#${summary?.stats.classRank ?? 1}`}
              subtitle={`of ${summary?.stats.totalStudentsInBatch ?? 32} Students`}
              iconName="trending-up"
              colorVariant="info"
              onPress={() => router.push('/(student)/(tabs)/tests')}
            />
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Today's Lectures</Text>
            <Badge label={summary?.enrolledBatch?.grade || 'Class 10'} variant="primary" size="sm" />
          </View>

          {summary?.todayClasses && summary.todayClasses.length > 0 ? (
            summary.todayClasses.map((cls) => (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classTimeBox}>
                  <Feather name="clock" size={14} color={theme.colors.primary.main} />
                  <Text style={styles.classTimeText}>{cls.timing}</Text>
                </View>

                <View style={styles.classDetails}>
                  <Text style={styles.classSubject}>{cls.subject}</Text>
                  <Text style={styles.classTeacher}>{cls.teacherName}</Text>
                </View>

                {cls.room ? (
                  <View style={styles.roomPill}>
                    <Text style={styles.roomText}>{cls.room}</Text>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No classes scheduled for today.</Text>
            </View>
          )}
        </View>

        {/* Study Materials & Notes Banner */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.materialsBanner}
            onPress={() => router.push('/(student)/(tabs)/materials')}
            activeOpacity={0.8}
          >
            <View style={styles.materialsBannerLeft}>
              <View style={styles.materialsIconCircle}>
                <Feather name="folder" size={20} color={theme.colors.primary.main} />
              </View>
              <View style={styles.materialsBannerTexts}>
                <View style={styles.materialsBannerTitleRow}>
                  <Text style={styles.materialsBannerTitle}>Study Materials & Notes</Text>
                  <Badge label="RESOURCES" variant="primary" size="sm" />
                </View>
                <Text style={styles.materialsBannerSubtitle}>
                  Access PDFs, formulas & PYQ question banks
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Announcements & Notices */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Notices & Announcements</Text>
            <Feather name="bell" size={16} color={theme.colors.text.secondary} />
          </View>

          {summary?.recentAnnouncements && summary.recentAnnouncements.length > 0 ? (
            summary.recentAnnouncements.map((ann) => (
              <View key={ann.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementTitleRow}>
                    <View
                      style={[
                        styles.announcementDot,
                        {
                          backgroundColor:
                            ann.tag === 'test'
                              ? theme.colors.state.warning
                              : theme.colors.primary.main,
                        },
                      ]}
                    />
                    <Text style={styles.announcementTitle}>{ann.title}</Text>
                  </View>
                  <Text style={styles.announcementDate}>{ann.date}</Text>
                </View>

                <Text style={styles.announcementMessage}>{ann.message}</Text>

                <View style={styles.announcementFooter}>
                  <Feather name="user-check" size={12} color={theme.colors.text.tertiary} />
                  <Text style={styles.announcementAuthor}>{ann.author}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent notices from the institute.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tuition Fee & Payment Modal */}
      <StudentFeeModal
        visible={isFeeModalVisible}
        onClose={() => {
          setIsFeeModalVisible(false);
          loadData();
        }}
        feeData={feeData}
        teacherName={summary?.enrolledBatch?.teacherName}
        instituteName={summary?.enrolledBatch?.instituteName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  feeBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    gap: 12,
  },
  feeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  feeBannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
  },
  feeBannerSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  feeBannerPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  feeBannerPayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.screen,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  classTimeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main + '10',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    gap: 2,
    minWidth: 90,
  },
  classTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
    textAlign: 'center',
  },
  classDetails: {
    flex: 1,
  },
  classSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  classTeacher: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  roomPill: {
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  announcementCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  announcementDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  announcementMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  announcementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  announcementAuthor: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  materialsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  materialsBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialsBannerTexts: {
    flex: 1,
    gap: 2,
  },
  materialsBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  materialsBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  materialsBannerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});
