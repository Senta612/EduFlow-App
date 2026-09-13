import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
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
import { Input } from '@/components/ui/Input';
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

  // Student Profile & Form Modal States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isStudentFormModalVisible, setIsStudentFormModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Form Inputs
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; roll?: string }>({});
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

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

  // Handlers for Student operations
  const handleOpenProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalVisible(true);
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormName('');
    // Suggest next roll number
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
    setIsProfileModalVisible(false);
    setIsStudentFormModalVisible(true);
  };

  const handleSaveStudent = async () => {
    const errors: { name?: string; roll?: string } = {};
    if (!formName.trim()) {
      errors.name = 'Student name is required';
    }
    if (!formRoll.trim()) {
      errors.roll = 'Roll number is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!batch) return;
    setIsSubmittingStudent(true);

    try {
      if (editingStudent) {
        // Update existing student
        const updated = await teacherService.updateStudent(batch.id, editingStudent.id, {
          name: formName.trim(),
          rollNumber: formRoll.trim(),
          parentPhone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
        });

        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? updated : s))
        );

        if (selectedStudent?.id === editingStudent.id) {
          setSelectedStudent(updated);
        }
      } else {
        // Add new student
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

  const handleDeleteStudent = (student: Student) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${student.name} from this batch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!batch) return;
            try {
              await teacherService.deleteStudent(batch.id, student.id);
              setStudents((prev) => prev.filter((s) => s.id !== student.id));
              setBatch((prev) =>
                prev ? { ...prev, studentCount: Math.max(0, prev.studentCount - 1) } : null
              );
              setIsProfileModalVisible(false);
              setSelectedStudent(null);
            } catch (error) {
              console.error('Failed to delete student:', error);
              Alert.alert('Error', 'Failed to remove student. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCallParent = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleMessageParent = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`sms:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to open SMS app.');
    });
  };

  const handleEmailStudent = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email app.');
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
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

        {/* STUDENTS ROSTER */}
        {activeTab === 'students' && (
          <View style={styles.sectionStack}>
            <View style={styles.blockHeader}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.titleWithBadge}>
                  <Text variant="heading" style={styles.blockTitle}>
                    Students
                  </Text>
                  <Badge
                    label={`${students.length} Total`}
                    variant="primary"
                    size="sm"
                  />
                </View>
                <Text variant="caption" style={styles.headerSubtitle}>
                  Tap on a student to view full profile & contact details
                </Text>
              </View>
              <Button
                title="Add Student"
                icon="plus"
                size="sm"
                variant="primary"
                onPress={handleOpenAddStudent}
              />
            </View>

            {students.length === 0 ? (
              <EmptyState
                icon="users"
                title="No students enrolled yet"
                description="Add students to this batch to track attendance, homework, and test marks."
                actionLabel="+ Add First Student"
                onAction={handleOpenAddStudent}
              />
            ) : (
              <View style={styles.studentsListContainer}>
                {students.map((student) => (
                  <Card
                    key={student.id}
                    variant="outlined"
                    padding="none"
                    style={styles.studentCard}
                  >
                    <Pressable
                      style={styles.studentCardContent}
                      onPress={() => handleOpenProfile(student)}
                    >
                      <View style={styles.studentAvatarBox}>
                        <Text variant="label" style={styles.studentAvatarText}>
                          {getInitials(student.name)}
                        </Text>
                      </View>

                      <View style={styles.studentInfo}>
                        <View style={styles.studentNameRow}>
                          <Text variant="label" style={styles.studentName}>
                            {student.name}
                          </Text>
                          <Badge
                            label={`Roll #${student.rollNumber}`}
                            variant="neutral"
                            size="sm"
                          />
                        </View>
                        <View style={styles.studentMetaRow}>
                          {student.parentPhone ? (
                            <View style={styles.studentMetaItem}>
                              <Feather
                                name="phone"
                                size={12}
                                color={theme.colors.text.secondary}
                              />
                              <Text variant="caption" style={styles.studentPhone}>
                                {student.parentPhone}
                              </Text>
                            </View>
                          ) : (
                            <Text variant="caption" style={styles.studentNoPhone}>
                              No phone added
                            </Text>
                          )}
                          {student.email && (
                            <View style={styles.studentMetaItem}>
                              <Feather
                                name="mail"
                                size={12}
                                color={theme.colors.text.disabled}
                              />
                              <Text
                                variant="caption"
                                numberOfLines={1}
                                style={styles.studentEmailShort}
                              >
                                {student.email}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.studentActionIcons}>
                        <Pressable
                          hitSlop={8}
                          style={styles.studentRowEditBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenEditStudent(student);
                          }}
                        >
                          <Feather
                            name="edit-2"
                            size={15}
                            color={theme.colors.primary.main}
                          />
                        </Pressable>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={theme.colors.text.disabled}
                        />
                      </View>
                    </Pressable>
                  </Card>
                ))}
              </View>
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

      {/* STUDENT PROFILE MODAL */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsProfileModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedStudent && (
              <View style={styles.profileContainer}>
                {/* Header with Close */}
                <View style={styles.modalHeader}>
                  <Text variant="heading" style={styles.modalTitle}>
                    Student Profile
                  </Text>
                  <Pressable
                    hitSlop={12}
                    style={styles.closeBtn}
                    onPress={() => setIsProfileModalVisible(false)}
                  >
                    <Feather name="x" size={20} color={theme.colors.text.secondary} />
                  </Pressable>
                </View>

                {/* Profile Hero */}
                <View style={styles.profileHero}>
                  <View style={styles.profileAvatarLarge}>
                    <Text variant="title" style={styles.profileAvatarText}>
                      {getInitials(selectedStudent.name)}
                    </Text>
                  </View>
                  <Text variant="heading" style={styles.profileName}>
                    {selectedStudent.name}
                  </Text>
                  <View style={styles.profileBadgesRow}>
                    <Badge
                      label={`Roll #${selectedStudent.rollNumber}`}
                      variant="primary"
                      size="md"
                    />
                    <Badge
                      label={batch.name}
                      variant="neutral"
                      size="md"
                    />
                  </View>
                </View>

                {/* Details Section */}
                <View style={styles.profileDetailsSection}>
                  <Text variant="caption" style={styles.sectionLabel}>
                    CONTACT & INFO
                  </Text>

                  {/* Parent Phone */}
                  <Card variant="outlined" padding="sm" style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <View style={styles.profileIconCircle}>
                        <Feather name="phone" size={16} color={theme.colors.primary.main} />
                      </View>
                      <View style={styles.profileInfoTexts}>
                        <Text variant="caption" style={styles.profileFieldLabel}>
                          Parent / Guardian Phone
                        </Text>
                        <Text variant="label" style={styles.profileFieldValue}>
                          {selectedStudent.parentPhone || 'Not provided'}
                        </Text>
                      </View>
                      {selectedStudent.parentPhone && (
                        <View style={styles.quickActionBtns}>
                          <Pressable
                            style={styles.quickBtn}
                            onPress={() => handleCallParent(selectedStudent.parentPhone)}
                          >
                            <Feather name="phone-call" size={13} color={theme.colors.semantic.success.main} />
                            <Text variant="caption" style={styles.quickBtnText}>Call</Text>
                          </Pressable>
                          <Pressable
                            style={styles.quickBtn}
                            onPress={() => handleMessageParent(selectedStudent.parentPhone)}
                          >
                            <Feather name="message-square" size={13} color={theme.colors.primary.main} />
                            <Text variant="caption" style={styles.quickBtnText}>SMS</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </Card>

                  {/* Email */}
                  <Card variant="outlined" padding="sm" style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <View style={styles.profileIconCircle}>
                        <Feather name="mail" size={16} color={theme.colors.primary.main} />
                      </View>
                      <View style={styles.profileInfoTexts}>
                        <Text variant="caption" style={styles.profileFieldLabel}>
                          Email Address
                        </Text>
                        <Text variant="label" numberOfLines={1} style={styles.profileFieldValue}>
                          {selectedStudent.email || 'Not provided'}
                        </Text>
                      </View>
                      {selectedStudent.email && (
                        <Pressable
                          style={styles.quickBtn}
                          onPress={() => handleEmailStudent(selectedStudent.email)}
                        >
                          <Feather name="send" size={13} color={theme.colors.primary.main} />
                          <Text variant="caption" style={styles.quickBtnText}>Email</Text>
                        </Pressable>
                      )}
                    </View>
                  </Card>
                </View>

                {/* Profile Actions */}
                <View style={styles.profileActionsRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Edit Student Info"
                      icon="edit-2"
                      variant="primary"
                      fullWidth
                      onPress={() => handleOpenEditStudent(selectedStudent)}
                    />
                  </View>
                  <Button
                    title="Remove"
                    icon="trash-2"
                    variant="danger"
                    onPress={() => handleDeleteStudent(selectedStudent)}
                  />
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ADD / EDIT STUDENT MODAL */}
      <Modal
        visible={isStudentFormModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStudentFormModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setIsStudentFormModalVisible(false)}
          />
          <View style={styles.modalFormSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text variant="heading" style={styles.modalTitle}>
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  {batch.name} • {batch.grade}
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.closeBtn}
                onPress={() => setIsStudentFormModalVisible(false)}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Student Full Name *"
                placeholder="e.g. Aarav Sharma"
                value={formName}
                onChangeText={(text) => {
                  setFormName(text);
                  if (formErrors.name) setFormErrors((e) => ({ ...e, name: undefined }));
                }}
                error={formErrors.name}
                leftContent={
                  <Feather name="user" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Roll Number / ID *"
                placeholder="e.g. 101"
                value={formRoll}
                onChangeText={(text) => {
                  setFormRoll(text);
                  if (formErrors.roll) setFormErrors((e) => ({ ...e, roll: undefined }));
                }}
                error={formErrors.roll}
                keyboardType="numeric"
                leftContent={
                  <Feather name="hash" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Parent / Guardian Phone"
                placeholder="e.g. +91 98765 43210"
                value={formPhone}
                onChangeText={setFormPhone}
                keyboardType="phone-pad"
                leftContent={
                  <Feather name="phone" size={16} color={theme.colors.text.secondary} />
                }
                helperText="Used for automated attendance SMS and notifications"
              />

              <Input
                label="Student Email (Optional)"
                placeholder="e.g. student@school.edu"
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftContent={
                  <Feather name="mail" size={16} color={theme.colors.text.secondary} />
                }
              />

              <View style={styles.formBtnRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    fullWidth
                    onPress={() => setIsStudentFormModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editingStudent ? 'Save Changes' : 'Add Student'}
                    variant="primary"
                    fullWidth
                    loading={isSubmittingStudent}
                    onPress={handleSaveStudent}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // Students list styles
  studentsListContainer: {
    gap: theme.spacing.sm,
  },
  studentCard: {
    overflow: 'hidden',
    backgroundColor: theme.colors.background.paper,
  },
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  studentAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.sm,
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  studentName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base - 1,
    fontWeight: theme.typography.weights.semibold,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  studentMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentPhone: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
  },
  studentNoPhone: {
    color: theme.colors.text.disabled,
    fontSize: theme.typography.sizes.xs,
    fontStyle: 'italic',
  },
  studentEmailShort: {
    color: theme.colors.text.disabled,
    fontSize: theme.typography.sizes.xs,
    maxWidth: 130,
  },
  studentActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  studentRowEditBtn: {
    padding: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalFormSheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  modalSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
  },

  // Profile modal content
  profileContainer: {
    gap: theme.spacing.md,
  },
  profileHero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
  },
  profileName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg + 2,
    textAlign: 'center',
  },
  profileBadgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  profileDetailsSection: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  sectionLabel: {
    color: theme.colors.text.disabled,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 4,
  },
  profileInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoTexts: {
    flex: 1,
    gap: 2,
  },
  profileFieldLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  profileFieldValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm + 1,
  },
  quickActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  quickBtnText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 11,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },

  // Form styles
  formContent: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
