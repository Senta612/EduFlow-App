import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  BatchOverviewSection,
  BatchStudentsSection,
  BatchAttendanceSection,
  BatchHomeworkSection,
  BatchTestsSection,
  AttendanceDetailModal,
  StudentFormModal,
} from '@/components/batch';
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

  // Student Form Modal States
  const [isStudentFormModalVisible, setIsStudentFormModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; roll?: string }>({});
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Attendance Record Detail Modal State
  const [selectedAttRecord, setSelectedAttRecord] = useState<AttendanceRecord | null>(null);
  const [isAttDetailModalVisible, setIsAttDetailModalVisible] = useState(false);
  const [attRecordFilter, setAttRecordFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [attSearchQuery, setAttSearchQuery] = useState('');

  const handleOpenAttendanceDetail = (record: AttendanceRecord) => {
    setSelectedAttRecord(record);
    setAttRecordFilter('all');
    setAttSearchQuery('');
    setIsAttDetailModalVisible(true);
  };

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

  useFocusEffect(
    useCallback(() => {
      loadBatchData();
    }, [loadBatchData]),
  );

  const handleOpenProfile = (student: Student) => {
    if (!batch) return;
    router.push({
      pathname: '/(teacher)/student/[id]',
      params: { id: student.id, batchId: batch.id },
    });
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormName('');
    const nextRoll = students.length > 0
      ? String(Math.max(...students.map((s) => parseInt(s.rollNumber, 10) || 0)) + 1)
      : '101';
    setFormRoll(nextRoll);
    setFormPhone('');
    setFormEmail('');
    setFormErrors({});
    setIsStudentFormModalVisible(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormRoll(student.rollNumber);
    setFormPhone(student.parentPhone || '');
    setFormEmail(student.email || '');
    setFormErrors({});
    setIsStudentFormModalVisible(true);
  };

  const handleSaveStudent = async () => {
    const errors: { name?: string; roll?: string } = {};
    if (!formName.trim()) errors.name = 'Student name is required';
    if (!formRoll.trim()) errors.roll = 'Roll number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!batch) return;
    setIsSubmittingStudent(true);

    try {
      if (editingStudent) {
        const updated = await teacherService.updateStudent(batch.id, editingStudent.id, {
          name: formName.trim(),
          rollNumber: formRoll.trim(),
          parentPhone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
        });

        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? updated : s))
        );
      } else {
        const newStudent = await teacherService.addStudent(batch.id, {
          name: formName.trim(),
          rollNumber: formRoll.trim(),
          parentPhone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
        });

        setStudents((prev) => [...prev, newStudent]);
        setBatch((prev) => (prev ? { ...prev, studentCount: prev.studentCount + 1 } : null));
      }

      setIsStudentFormModalVisible(false);
    } catch (error) {
      console.error('Failed to save student:', error);
      Alert.alert('Error', 'Failed to save student details. Please try again.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleCallParent = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

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
            const tabLabel =
              tab.key === 'students' ? `Students (${students.length})` : tab.label;
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
                  {tabLabel}
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
        {activeTab === 'overview' && (
          <BatchOverviewSection
            batch={batch}
            students={students}
            homeworkList={homeworkList}
            testsList={testsList}
            onSwitchTab={setActiveTab}
            onTakeAttendance={() => router.push(`/(teacher)/attendance/${batch.id}`)}
          />
        )}

        {activeTab === 'students' && (
          <BatchStudentsSection
            students={students}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenProfile={handleOpenProfile}
            onOpenEditStudent={handleOpenEditStudent}
          />
        )}

        {activeTab === 'attendance' && (
          <BatchAttendanceSection
            batch={batch}
            attendanceHistory={attendanceHistory}
            onTakeAttendance={() => router.push(`/(teacher)/attendance/${batch.id}`)}
            onOpenAttendanceDetail={handleOpenAttendanceDetail}
          />
        )}

        {activeTab === 'homework' && (
          <BatchHomeworkSection
            batch={batch}
            homeworkList={homeworkList}
            onCreateHomework={() =>
              router.push(`/(teacher)/homework/create?batchId=${batch.id}`)
            }
            onOpenHomeworkSubmissions={(hwId) =>
              router.push(`/(teacher)/homework/${hwId}/submissions`)
            }
          />
        )}

        {activeTab === 'tests' && (
          <BatchTestsSection
            batch={batch}
            testsList={testsList}
            onCreateTest={() =>
              router.push(`/(teacher)/tests/create?batchId=${batch.id}`)
            }
            onOpenMarks={(testId) =>
              router.push(`/(teacher)/tests/${testId}/marks`)
            }
          />
        )}
      </ScrollView>

      {/* Student Add / Edit Modal */}
      <StudentFormModal
        visible={isStudentFormModalVisible}
        onClose={() => setIsStudentFormModalVisible(false)}
        editingStudent={editingStudent}
        formName={formName}
        onChangeName={setFormName}
        formRoll={formRoll}
        onChangeRoll={setFormRoll}
        formPhone={formPhone}
        onChangePhone={setFormPhone}
        formEmail={formEmail}
        onChangeEmail={setFormEmail}
        errors={formErrors}
        isSubmitting={isSubmittingStudent}
        onSave={handleSaveStudent}
      />

      {/* Attendance Session Details Modal */}
      <AttendanceDetailModal
        visible={isAttDetailModalVisible}
        onClose={() => setIsAttDetailModalVisible(false)}
        record={selectedAttRecord}
        batch={batch}
        students={students}
        filter={attRecordFilter}
        onChangeFilter={setAttRecordFilter}
        searchQuery={attSearchQuery}
        onChangeSearchQuery={setAttSearchQuery}
        onCallParent={handleCallParent}
        onSelectStudent={handleOpenProfile}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    gap: theme.spacing.xs,
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
    gap: theme.spacing.lg,
  },
});
