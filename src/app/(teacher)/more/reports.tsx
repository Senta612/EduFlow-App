import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  ReportsOverviewCards,
  DefaultersAlertSection,
  TestToppersSection,
  BatchAttendanceSection,
  ShareStudentReportModal,
  EnrolledStudentsModal,
  EnrolledStudentItem,
} from '@/components/reports';
import {
  teacherService,
  formatDefaulterWhatsAppMessage,
  formatTopperWhatsAppMessage,
} from '@/services/teacher.service';
import {
  Batch,
  TuitionAnalyticsSummary,
  DefaulterStudent,
  TestRankStudent,
} from '@/types/teacher';
import { theme } from '@/theme';

export default function TeacherReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [allStudents, setAllStudents] = useState<EnrolledStudentItem[]>([]);
  const [analytics, setAnalytics] = useState<TuitionAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter State
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  // Student Directory Modal State
  const [isStudentsModalVisible, setIsStudentsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryBatchFilter, setDirectoryBatchFilter] = useState<string>('all');

  // Share Progress Slip Modal State
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareTargetStudent, setShareTargetStudent] = useState<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    parentPhone?: string;
    batchId: string;
    batchName: string;
  } | null>(null);

  const loadData = useCallback(async (batchFilter: string = selectedBatchId) => {
    try {
      const [bList, analyticsData] = await Promise.all([
        teacherService.getBatches(),
        teacherService.getTuitionAnalytics(batchFilter),
      ]);
      setBatches(bList);
      setAnalytics(analyticsData);

      // Load enrolled students list for directory
      const enrolled: EnrolledStudentItem[] = [];
      for (const b of bList) {
        const students = await teacherService.getBatchStudents(b.id);
        for (const s of students) {
          enrolled.push({
            ...s,
            batchId: b.id,
            batchName: b.name,
            batchSubject: b.subject,
            batchGrade: b.grade,
          });
        }
      }
      setAllStudents(enrolled);
    } catch (error) {
      console.error('Failed to load tuition report data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadData(selectedBatchId);
  }, [selectedBatchId, loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(selectedBatchId);
  };

  const handleSelectBatchFilter = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  // WhatsApp & Phone Communication Handlers
  const handleCallParent = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'No parent phone number provided for this student.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call on this device.');
    });
  };

  const handleDefaulterWhatsApp = (student: DefaulterStudent) => {
    const issuesSummary = student.issues.map((i) => `${i.label} (${i.details})`).join(' • ');
    const message = formatDefaulterWhatsAppMessage({
      studentName: student.studentName,
      batchName: student.batchName,
      issuesSummary,
    });

    const cleanPhone = (student.parentPhone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    const fallbackUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('WhatsApp Error', 'Unable to launch WhatsApp on this device.');
      });
    });
  };

  const handleTopperWhatsApp = (
    topper: TestRankStudent,
    testTitle: string,
    batchName: string,
  ) => {
    const message = formatTopperWhatsAppMessage({
      studentName: topper.studentName,
      batchName,
      testTitle,
      rank: topper.rank,
      marksObtained: topper.marksObtained,
      maxMarks: topper.maxMarks,
    });

    const cleanPhone = (topper.parentPhone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    const fallbackUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('WhatsApp Error', 'Unable to launch WhatsApp on this device.');
      });
    });
  };

  const handleOpenStudentReportModal = (student: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    parentPhone?: string;
    batchId: string;
    batchName: string;
  }) => {
    setShareTargetStudent(student);
    setIsShareModalVisible(true);
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
        title="Tuition Reports & Analytics"
        subtitle="Attendance trends, at-risk alerts & test rankings"
        showBack
      />

      {/* Batch Scope Filter Pills */}
      <View style={styles.batchFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.batchFilterContent}
        >
          <Pressable
            style={[
              styles.batchFilterChip,
              selectedBatchId === 'all' && styles.batchFilterChipActive,
            ]}
            onPress={() => handleSelectBatchFilter('all')}
          >
            <Text
              variant="caption"
              style={[
                styles.batchFilterChipText,
                selectedBatchId === 'all' && styles.batchFilterChipTextActive,
              ]}
            >
              All Batches
            </Text>
          </Pressable>

          {batches.map((b) => {
            const isSelected = selectedBatchId === b.id;
            return (
              <Pressable
                key={b.id}
                style={[
                  styles.batchFilterChip,
                  isSelected && styles.batchFilterChipActive,
                ]}
                onPress={() => handleSelectBatchFilter(b.id)}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.batchFilterChipText,
                    isSelected && styles.batchFilterChipTextActive,
                  ]}
                >
                  {b.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="body" style={styles.loadingText}>
              Aggregating tuition performance insights...
            </Text>
          </View>
        ) : (
          analytics && (
            <>
              {/* 1. Tuition Overview Metric Cards */}
              <ReportsOverviewCards
                totalStudents={analytics.totalStudentsCount}
                averageAttendance={analytics.averageAttendance}
                defaultersCount={analytics.defaulters.length}
                hwCompletionRate={analytics.hwCompletionRate}
                totalTests={analytics.totalTestsConducted}
                onPressStudents={() => {
                  setDirectoryBatchFilter(selectedBatchId);
                  setIsStudentsModalVisible(true);
                }}
              />

              {/* 2. Quick Student Directory Banner */}
              <Pressable
                style={({ pressed }) => [
                  styles.directoryBanner,
                  pressed && styles.bannerPressed,
                ]}
                onPress={() => {
                  setDirectoryBatchFilter(selectedBatchId);
                  setIsStudentsModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Open student directory"
              >
                <View style={styles.directoryBannerLeft}>
                  <View style={styles.directoryIconBox}>
                    <Feather name="users" size={20} color={theme.colors.primary.main} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" style={styles.directoryBannerTitle}>
                      Student Directory & Progress Slips
                    </Text>
                    <Text variant="caption" style={styles.directoryBannerSubtitle}>
                      Search, view records & send WhatsApp report slips
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.primary.main} />
              </Pressable>

              {/* 3. At-Risk / Defaulters Alert Section */}
              <DefaultersAlertSection
                defaulters={analytics.defaulters}
                onWhatsApp={handleDefaulterWhatsApp}
                onCall={handleCallParent}
                onOpenReport={(item) =>
                  handleOpenStudentReportModal({
                    studentId: item.studentId,
                    studentName: item.studentName,
                    rollNumber: item.rollNumber,
                    parentPhone: item.parentPhone,
                    batchId: item.batchId,
                    batchName: item.batchName,
                  })
                }
              />

              {/* 4. Weekly Test Leaderboards & Topper Showcase */}
              <TestToppersSection
                leaderboards={analytics.testLeaderboards}
                onTopperWhatsApp={handleTopperWhatsApp}
                onOpenMarksheet={(testId) =>
                  router.push(`/(teacher)/tests/${testId}/marks`)
                }
              />

              {/* 5. Batch Attendance & Health Register */}
              <BatchAttendanceSection
                batchSummaries={analytics.batchSummaries}
                onOpenBatch={(batchId) => router.push(`/(teacher)/batch/${batchId}`)}
              />
            </>
          )
        )}
      </ScrollView>

      {/* Modular Enrolled Students Directory Modal */}
      <EnrolledStudentsModal
        visible={isStudentsModalVisible}
        onClose={() => setIsStudentsModalVisible(false)}
        batches={batches}
        allStudents={allStudents}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        selectedBatchFilter={directoryBatchFilter}
        onSelectBatchFilter={setDirectoryBatchFilter}
        onCallParent={handleCallParent}
        onSelectStudent={handleOpenStudentProfile}
      />

      {/* Modular 1-Tap Student Progress Card Modal */}
      <ShareStudentReportModal
        visible={isShareModalVisible}
        onClose={() => {
          setIsShareModalVisible(false);
          setShareTargetStudent(null);
        }}
        targetStudent={shareTargetStudent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  batchFilterBar: {
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingVertical: 8,
  },
  batchFilterContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  batchFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  batchFilterChipActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  batchFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  batchFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  directoryBanner: {
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
  bannerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  directoryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  directoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directoryBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  directoryBannerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
