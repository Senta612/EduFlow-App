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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  StudentHeroCard,
  StudentMetricsGrid,
  StudentOverviewTab,
  StudentAttendanceTab,
  StudentHomeworkTab,
  StudentTestsTab,
  EditStudentModal,
} from '@/components/student';
import { teacherService } from '@/services/teacher.service';
import { StudentProfileData } from '@/types/teacher';
import { theme } from '@/theme';

type ReportTab = 'overview' | 'attendance' | 'homework' | 'tests';

export default function StudentProfileScreen() {
  const { id, batchId } = useLocalSearchParams<{ id: string; batchId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState<StudentProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [homeworkFilter, setHomeworkFilter] = useState<'all' | 'done' | 'pending'>('all');

  // Edit Student Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; roll?: string }>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      let targetBatchId = batchId;
      if (!targetBatchId) {
        const batches = await teacherService.getBatches();
        for (const b of batches) {
          const students = await teacherService.getBatchStudents(b.id);
          if (students.some((s) => s.id === id)) {
            targetBatchId = b.id;
            break;
          }
        }
      }

      if (!targetBatchId) {
        setIsLoading(false);
        return;
      }

      const profileData = await teacherService.getStudentProfileData(targetBatchId, id);
      setData(profileData);
    } catch (error) {
      console.error('Failed to load student profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, batchId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Communication Handlers
  const handleCallParent = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'No parent phone number has been provided for this student.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call on this device.');
    });
  };

  const handleMessageParent = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'No parent phone number has been provided for this student.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`sms:${cleanPhone}`).catch(() => {
      Alert.alert('Message Failed', 'Unable to open messaging app.');
    });
  };

  const handleEmailStudent = (email?: string) => {
    if (!email) {
      Alert.alert('No Email Address', 'No email address registered for this student.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email Failed', 'Unable to open email client.');
    });
  };

  // Edit Form Handlers
  const handleOpenEdit = () => {
    if (!data) return;
    setEditName(data.student.name);
    setEditRoll(data.student.rollNumber);
    setEditPhone(data.student.parentPhone || '');
    setEditEmail(data.student.email || '');
    setEditErrors({});
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!data) return;
    const errors: { name?: string; roll?: string } = {};
    if (!editName.trim()) errors.name = 'Student name is required';
    if (!editRoll.trim()) errors.roll = 'Roll number is required';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await teacherService.updateStudent(data.batch.id, data.student.id, {
        name: editName.trim(),
        rollNumber: editRoll.trim(),
        parentPhone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
      });

      setIsEditModalVisible(false);
      await loadData();
      Alert.alert('Success', 'Student details updated successfully.');
    } catch (error) {
      console.error('Failed to update student:', error);
      Alert.alert('Error', 'Failed to update student. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteStudent = () => {
    if (!data) return;
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${data.student.name} from ${data.batch.name}? This will remove all their records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await teacherService.deleteStudent(data.batch.id, data.student.id);
              Alert.alert('Removed', `${data.student.name} has been removed.`);
              router.back();
            } catch (error) {
              console.error('Failed to remove student:', error);
              Alert.alert('Error', 'Could not remove student.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text variant="body" style={styles.loadingText}>
          Loading student profile & reports...
        </Text>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title="Student Profile" showBack />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="user-x"
            title="Student Not Found"
            description="The requested student profile could not be loaded or was removed."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { student, batch, attendance, homework, tests } = data;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top App Header */}
      <ScreenHeader
        title="Student Profile"
        subtitle={`${batch.name} • ${batch.grade}`}
        showBack
        rightAction={
          <View style={styles.headerRightActions}>
            <Pressable hitSlop={10} style={styles.headerIconBtn} onPress={handleOpenEdit}>
              <Feather name="edit-2" size={18} color={theme.colors.primary.main} />
            </Pressable>
            <Pressable hitSlop={10} style={styles.headerIconBtn} onPress={handleDeleteStudent}>
              <Feather name="trash-2" size={18} color={theme.colors.semantic.danger.main} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Card */}
        <StudentHeroCard
          student={student}
          batch={batch}
          onCallParent={handleCallParent}
          onMessageParent={handleMessageParent}
          onEmailStudent={handleEmailStudent}
        />

        {/* 2. 4 Quick Stat Metric Badges */}
        <StudentMetricsGrid
          attendance={attendance}
          homework={homework}
          tests={tests}
        />

        {/* 3. Segmented Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Feather
              name="grid"
              size={14}
              color={activeTab === 'overview' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}
            >
              Overview
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'attendance' && styles.tabButtonActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Feather
              name="check-circle"
              size={14}
              color={activeTab === 'attendance' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}
            >
              Attendance
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'homework' && styles.tabButtonActive]}
            onPress={() => setActiveTab('homework')}
          >
            <Feather
              name="book-open"
              size={14}
              color={activeTab === 'homework' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[styles.tabText, activeTab === 'homework' && styles.tabTextActive]}
            >
              Homework
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'tests' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tests')}
          >
            <Feather
              name="award"
              size={14}
              color={activeTab === 'tests' ? theme.colors.primary.main : theme.colors.text.secondary}
            />
            <Text
              variant="label"
              style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}
            >
              Tests & Marks
            </Text>
          </Pressable>
        </View>

        {/* 4. Active Tab Content */}
        {activeTab === 'overview' && (
          <StudentOverviewTab
            data={data}
            onOpenEdit={handleOpenEdit}
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === 'attendance' && (
          <StudentAttendanceTab
            attendance={attendance}
            filter={attendanceFilter}
            onFilterChange={setAttendanceFilter}
          />
        )}

        {activeTab === 'homework' && (
          <StudentHomeworkTab
            homework={homework}
            filter={homeworkFilter}
            onFilterChange={setHomeworkFilter}
          />
        )}

        {activeTab === 'tests' && (
          <StudentTestsTab tests={tests} />
        )}
      </ScrollView>

      {/* 5. Edit Student Modal */}
      <EditStudentModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        name={editName}
        onChangeName={setEditName}
        roll={editRoll}
        onChangeRoll={setEditRoll}
        phone={editPhone}
        onChangePhone={setEditPhone}
        email={editEmail}
        onChangeEmail={setEditEmail}
        errors={editErrors}
        isSubmitting={isSubmittingEdit}
        onSave={handleSaveEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.screen,
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  emptyWrap: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: theme.radii.md,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
});
