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
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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

  // Handlers for Student operations
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

  const formatRecordDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
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
              <Pressable
                style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
                onPress={() => setActiveTab('students')}
                accessibilityRole="button"
                accessibilityLabel="View students list"
              >
                <Card variant="outlined" padding="md" style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: theme.colors.primary.bg }]}>
                    <Feather name="users" size={16} color={theme.colors.primary.main} />
                  </View>
                  <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
                    Total Students
                  </Text>
                  <Text variant="title" style={styles.statNumber}>
                    {students.length}
                  </Text>
                  <View style={styles.statArrowRow}>
                    <Text variant="caption" style={styles.statActionHint}>
                      View Roster
                    </Text>
                    <Feather name="chevron-right" size={12} color={theme.colors.primary.main} />
                  </View>
                </Card>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
                onPress={() => setActiveTab('homework')}
                accessibilityRole="button"
                accessibilityLabel="View homework assignments"
              >
                <Card variant="outlined" padding="md" style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Feather name="book-open" size={16} color="#0284C7" />
                  </View>
                  <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
                    Homework
                  </Text>
                  <Text variant="title" style={[styles.statNumber, { color: '#0284C7' }]}>
                    {homeworkList.length}
                  </Text>
                  <View style={styles.statArrowRow}>
                    <Text variant="caption" style={[styles.statActionHint, { color: '#0284C7' }]}>
                      View All
                    </Text>
                    <Feather name="chevron-right" size={12} color="#0284C7" />
                  </View>
                </Card>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.statCardWrapper, pressed && styles.statCardPressed]}
                onPress={() => setActiveTab('tests')}
                accessibilityRole="button"
                accessibilityLabel="View tests and marks"
              >
                <Card variant="outlined" padding="md" style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
                    <Feather name="award" size={16} color="#8B5CF6" />
                  </View>
                  <Text variant="caption" numberOfLines={1} style={styles.statLabel}>
                    Tests Done
                  </Text>
                  <Text variant="title" style={[styles.statNumber, { color: '#8B5CF6' }]}>
                    {testsList.length}
                  </Text>
                  <View style={styles.statArrowRow}>
                    <Text variant="caption" style={[styles.statActionHint, { color: '#8B5CF6' }]}>
                      View Marks
                    </Text>
                    <Feather name="chevron-right" size={12} color="#8B5CF6" />
                  </View>
                </Card>
              </Pressable>
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
                    {hw.description ? (
                      <Text variant="caption" numberOfLines={2} style={styles.itemDesc}>
                        {hw.description}
                      </Text>
                    ) : null}
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
              attendanceHistory.map((rec) => {
                const total = rec.totalStudents || 1;
                const attendanceRate = Math.round((rec.presentCount / total) * 100);
                const isGreat = attendanceRate >= 85;

                return (
                  <Card key={rec.id} variant="outlined" padding="none" style={styles.attCard}>
                    <Pressable
                      style={({ pressed }) => [styles.attCardPressable, pressed && styles.attCardPressed]}
                      onPress={() => handleOpenAttendanceDetail(rec)}
                    >
                      <View style={styles.attCardHeader}>
                        <View style={styles.attDateGroup}>
                          <View
                            style={[
                              styles.attCalendarIconBox,
                              {
                                backgroundColor: isGreat
                                  ? theme.colors.semantic.success.bg
                                  : theme.colors.primary.bg,
                              },
                            ]}
                          >
                            <Feather
                              name="calendar"
                              size={16}
                              color={
                                isGreat
                                  ? theme.colors.semantic.success.main
                                  : theme.colors.primary.main
                              }
                            />
                          </View>
                          <View>
                            <Text variant="label" style={styles.attDateText}>
                              {formatRecordDate(rec.date)}
                            </Text>
                            <Text variant="caption" style={styles.attSubText}>
                              {batch.name} • Class Session
                            </Text>
                          </View>
                        </View>
                        <Badge
                          label={`${attendanceRate}% Present`}
                          variant={isGreat ? 'success' : 'warning'}
                          size="sm"
                        />
                      </View>

                      {/* Presence Progress Bar */}
                      <View style={styles.attProgressBarTrack}>
                        <View
                          style={[
                            styles.attProgressBarFill,
                            {
                              width: `${Math.min(100, Math.max(0, attendanceRate))}%`,
                              backgroundColor: isGreat
                                ? theme.colors.semantic.success.main
                                : theme.colors.semantic.warning.main,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.attBottomRow}>
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
                        <View style={styles.attViewHintRow}>
                          <Text variant="caption" style={styles.attViewHintText}>
                            View Students
                          </Text>
                          <Feather
                            name="chevron-right"
                            size={14}
                            color={theme.colors.primary.main}
                          />
                        </View>
                      </View>
                    </Pressable>
                  </Card>
                );
              })
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

                    {hw.description ? (
                      <Text variant="body" numberOfLines={3} style={styles.hwDesc}>
                        {hw.description}
                      </Text>
                    ) : null}

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

                    {/* Check / Mark Submissions CTA */}
                    <View style={styles.hwActionRow}>
                      <Button
                        title="Check & Mark Submissions →"
                        icon="check-circle"
                        variant="primary"
                        fullWidth
                        size="sm"
                        onPress={() =>
                          router.push(`/(teacher)/homework/${hw.id}/submissions`)
                        }
                      />
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

      {/* ATTENDANCE RECORD DETAIL ROSTER MODAL */}
      <Modal
        visible={isAttDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAttDetailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setIsAttDetailModalVisible(false)}
          />
          {selectedAttRecord && (
            <View style={[styles.attModalSheet, { paddingBottom: insets.bottom + 16 }]}>
              {/* Modal Header */}
              <View style={styles.attModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="heading" style={styles.modalTitle}>
                    Attendance Session Roster
                  </Text>
                  <Text variant="caption" style={styles.modalSubtitle}>
                    {formatRecordDate(selectedAttRecord.date)} • {batch.name}
                  </Text>
                </View>
                <Pressable
                  hitSlop={12}
                  style={styles.closeBtn}
                  onPress={() => setIsAttDetailModalVisible(false)}
                >
                  <Feather name="x" size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {/* Attendance Quick Stats Strip */}
              <View style={styles.attSummaryStrip}>
                <View style={styles.attSummaryCol}>
                  <Text variant="heading" style={styles.attSummaryNum}>
                    {selectedAttRecord.totalStudents}
                  </Text>
                  <Text variant="caption" style={styles.attSummaryLabel}>
                    Total Students
                  </Text>
                </View>
                <View style={styles.attSummaryDivider} />
                <View style={styles.attSummaryCol}>
                  <Text
                    variant="heading"
                    style={[styles.attSummaryNum, { color: theme.colors.semantic.success.main }]}
                  >
                    {selectedAttRecord.presentCount}
                  </Text>
                  <Text variant="caption" style={styles.attSummaryLabel}>
                    Present ({Math.round((selectedAttRecord.presentCount / (selectedAttRecord.totalStudents || 1)) * 100)}%)
                  </Text>
                </View>
                <View style={styles.attSummaryDivider} />
                <View style={styles.attSummaryCol}>
                  <Text
                    variant="heading"
                    style={[styles.attSummaryNum, { color: theme.colors.semantic.danger.main }]}
                  >
                    {selectedAttRecord.absentCount}
                  </Text>
                  <Text variant="caption" style={styles.attSummaryLabel}>
                    Absent
                  </Text>
                </View>
              </View>

              {/* Search Box */}
              <View style={styles.attSearchWrap}>
                <Input
                  placeholder="Search student name or roll number..."
                  value={attSearchQuery}
                  onChangeText={setAttSearchQuery}
                  leftContent={
                    <Feather name="search" size={16} color={theme.colors.text.secondary} />
                  }
                  rightContent={
                    attSearchQuery ? (
                      <Pressable hitSlop={8} onPress={() => setAttSearchQuery('')}>
                        <Feather name="x-circle" size={16} color={theme.colors.text.disabled} />
                      </Pressable>
                    ) : null
                  }
                />
              </View>

              {/* Filter Chips */}
              <View style={styles.attFilterChipsRow}>
                <Pressable
                  style={[styles.attFilterChip, attRecordFilter === 'all' && styles.attFilterChipActive]}
                  onPress={() => setAttRecordFilter('all')}
                >
                  <Text
                    variant="caption"
                    style={[styles.attFilterChipText, attRecordFilter === 'all' && styles.attFilterChipTextActive]}
                  >
                    All ({selectedAttRecord.records?.length || 0})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.attFilterChip, attRecordFilter === 'present' && styles.attFilterChipActive]}
                  onPress={() => setAttRecordFilter('present')}
                >
                  <Text
                    variant="caption"
                    style={[styles.attFilterChipText, attRecordFilter === 'present' && styles.attFilterChipTextActive]}
                  >
                    Present ({selectedAttRecord.presentCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.attFilterChip, attRecordFilter === 'absent' && styles.attFilterChipActive]}
                  onPress={() => setAttRecordFilter('absent')}
                >
                  <Text
                    variant="caption"
                    style={[styles.attFilterChipText, attRecordFilter === 'absent' && styles.attFilterChipTextActive]}
                  >
                    Absent ({selectedAttRecord.absentCount})
                  </Text>
                </Pressable>
              </View>

              {/* Students Attendance List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.attRosterScroll}
                keyboardShouldPersistTaps="handled"
              >
                {(() => {
                  const filtered = (selectedAttRecord.records || []).filter((item) => {
                    const matchStatus =
                      attRecordFilter === 'all' || item.status === attRecordFilter;
                    const q = attSearchQuery.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      item.studentName.toLowerCase().includes(q) ||
                      item.rollNumber.toLowerCase().includes(q);
                    return matchStatus && matchSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <EmptyState
                        icon="users"
                        title="No students matched"
                        description={
                          attSearchQuery
                            ? `No students found matching "${attSearchQuery}".`
                            : `No ${attRecordFilter} students in this session.`
                        }
                      />
                    );
                  }

                  return filtered.map((item) => {
                    const isPresent = item.status === 'present';
                    const matchedStudent = students.find((s) => s.id === item.studentId);

                    return (
                      <Card
                        key={item.studentId}
                        variant="outlined"
                        padding="none"
                        style={styles.attStudentCard}
                      >
                        <Pressable
                          style={styles.attStudentPressable}
                          onPress={() => {
                            setIsAttDetailModalVisible(false);
                            router.push({
                              pathname: '/(teacher)/student/[id]',
                              params: { id: item.studentId, batchId: batch.id },
                            });
                          }}
                        >
                          <View
                            style={[
                              styles.attStudentAvatar,
                              {
                                backgroundColor: isPresent
                                  ? theme.colors.semantic.success.bg
                                  : theme.colors.semantic.danger.bg,
                              },
                            ]}
                          >
                            <Text
                              variant="label"
                              style={{
                                color: isPresent
                                  ? theme.colors.semantic.success.main
                                  : theme.colors.semantic.danger.main,
                                fontWeight: '700',
                              }}
                            >
                              {getInitials(item.studentName)}
                            </Text>
                          </View>

                          <View style={styles.attStudentInfo}>
                            <View style={styles.attStudentNameRow}>
                              <Text variant="label" style={styles.attStudentName}>
                                {item.studentName}
                              </Text>
                              <Badge
                                label={`Roll #${item.rollNumber}`}
                                variant="neutral"
                                size="sm"
                              />
                            </View>

                            <Text variant="caption" style={styles.attStudentStatusSub}>
                              {isPresent ? 'Marked Present' : 'Marked Absent'}
                            </Text>
                          </View>

                          <View style={styles.attActionCol}>
                            <Badge
                              label={isPresent ? 'Present' : 'Absent'}
                              variant={isPresent ? 'success' : 'danger'}
                              size="sm"
                            />

                            {!isPresent && matchedStudent?.parentPhone ? (
                              <Pressable
                                hitSlop={8}
                                style={styles.attCallBtn}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleCallParent(matchedStudent.parentPhone);
                                }}
                              >
                                <Feather
                                  name="phone"
                                  size={12}
                                  color={theme.colors.semantic.success.main}
                                />
                                <Text variant="caption" style={styles.attCallText}>
                                  Call
                                </Text>
                              </Pressable>
                            ) : null}
                          </View>
                        </Pressable>
                      </Card>
                    );
                  });
                })()}
              </ScrollView>
            </View>
          )}
        </View>
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
  statCardWrapper: {
    flex: 1,
  },
  statCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 2,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  statNumber: {
    color: theme.colors.primary.main,
    fontSize: 20,
    fontWeight: '800',
  },
  statArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statActionHint: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary.main,
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
  hwActionRow: {
    marginTop: 4,
  },

  // Attendance Card styles
  attCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  attCardPressable: {
    padding: theme.spacing.md,
    gap: 10,
  },
  attCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  attCalendarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attSubText: {
    color: theme.colors.text.disabled,
    fontSize: 11,
  },
  attProgressBarTrack: {
    height: 6,
    backgroundColor: theme.colors.border.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  attProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  attBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  attViewHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attViewHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },

  // Attendance Detail Modal styles
  attModalSheet: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    gap: 12,
  },
  attModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  attSummaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.screen,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  attSummaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  attSummaryNum: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  attSummaryLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  attSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border.main,
  },
  attSearchWrap: {
    paddingHorizontal: 20,
  },
  attFilterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  attFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  attFilterChipActive: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  attFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  attFilterChipTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  attRosterScroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 8,
  },
  attStudentCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  attStudentPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  attStudentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attStudentInfo: {
    flex: 1,
    gap: 4,
  },
  attStudentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  attStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  attStudentStatusSub: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  attActionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  attCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.semantic.success.bg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radii.sm,
  },
  attCallText: {
    fontSize: 11,
    color: theme.colors.semantic.success.main,
    fontWeight: '600',
  },
});
