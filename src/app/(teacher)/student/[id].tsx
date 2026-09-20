import React, { useCallback, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { teacherService } from '@/services/teacher.service';
import { StudentProfileData, AttendanceStatus, HomeworkStatus } from '@/types/teacher';
import { theme } from '@/theme';

type ReportTab = 'overview' | 'attendance' | 'homework' | 'tests';

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr: string): string {
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
}

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
      // Find batchId if not provided
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

  // Quick Communication Handlers
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

  // Edit Student Form Handlers
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

  // Delete Student Handler
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

  // Filtered lists
  const filteredAttendance = attendance.history.filter((item) => {
    if (attendanceFilter === 'present') return item.status === 'present';
    if (attendanceFilter === 'absent') return item.status === 'absent';
    return true;
  });

  const filteredHomework = homework.items.filter((item) => {
    if (homeworkFilter === 'done') return item.status === 'done';
    if (homeworkFilter === 'pending') return item.status === 'half_done' || item.status === 'not_done';
    return true;
  });

  // Overall attendance health variant
  const getAttendanceVariant = (pct: number): 'success' | 'warning' | 'danger' => {
    if (pct >= 85) return 'success';
    if (pct >= 75) return 'warning';
    return 'danger';
  };

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
        {/* Student Profile Hero Card */}
        <Card variant="elevated" padding="md" style={styles.heroCard}>
          <View style={styles.heroMainRow}>
            <View style={styles.avatarWrap}>
              <Text variant="title" style={styles.avatarText}>
                {getInitials(student.name)}
              </Text>
            </View>

            <View style={styles.heroInfo}>
              <Text variant="heading" style={styles.studentName}>
                {student.name}
              </Text>
              <View style={styles.heroBadgesRow}>
                <Badge label={`Roll #${student.rollNumber}`} variant="primary" size="sm" />
                <Badge label={batch.subject} variant="neutral" size="sm" />
              </View>
            </View>
          </View>

          {/* Quick Communication Strip */}
          <View style={styles.contactActionStrip}>
            <Pressable
              style={[styles.contactPill, !student.parentPhone && styles.contactPillDisabled]}
              onPress={() => handleCallParent(student.parentPhone)}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: theme.colors.semantic.success.bg }]}>
                <Feather name="phone" size={14} color={theme.colors.semantic.success.main} />
              </View>
              <Text variant="caption" style={styles.contactPillLabel}>
                Call Parent
              </Text>
            </Pressable>

            <Pressable
              style={[styles.contactPill, !student.parentPhone && styles.contactPillDisabled]}
              onPress={() => handleMessageParent(student.parentPhone)}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: theme.colors.primary.bg }]}>
                <Feather name="message-square" size={14} color={theme.colors.primary.main} />
              </View>
              <Text variant="caption" style={styles.contactPillLabel}>
                SMS / Chat
              </Text>
            </Pressable>

            <Pressable
              style={[styles.contactPill, !student.email && styles.contactPillDisabled]}
              onPress={() => handleEmailStudent(student.email)}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Feather name="mail" size={14} color="#7E22CE" />
              </View>
              <Text variant="caption" style={styles.contactPillLabel}>
                Email
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* 4 Quick Stat Metric Badges */}
        <View style={styles.metricsGrid}>
          <Card variant="outlined" padding="sm" style={styles.metricTile}>
            <Text variant="caption" style={styles.metricLabel}>
              Attendance
            </Text>
            <Text
              variant="heading"
              style={[
                styles.metricValue,
                {
                  color:
                    attendance.percentage >= 85
                      ? theme.colors.semantic.success.main
                      : attendance.percentage >= 75
                      ? theme.colors.semantic.warning.main
                      : theme.colors.semantic.danger.main,
                },
              ]}
            >
              {attendance.percentage}%
            </Text>
            <Text variant="caption" style={styles.metricSub}>
              {attendance.presentCount}/{attendance.totalClasses} Days
            </Text>
          </Card>

          <Card variant="outlined" padding="sm" style={styles.metricTile}>
            <Text variant="caption" style={styles.metricLabel}>
              Homework
            </Text>
            <Text variant="heading" style={[styles.metricValue, { color: theme.colors.primary.main }]}>
              {homework.completionPercentage}%
            </Text>
            <Text variant="caption" style={styles.metricSub}>
              {homework.doneCount}/{homework.totalAssigned} Done
            </Text>
          </Card>

          <Card variant="outlined" padding="sm" style={styles.metricTile}>
            <Text variant="caption" style={styles.metricLabel}>
              Test Average
            </Text>
            <Text variant="heading" style={[styles.metricValue, { color: '#8B5CF6' }]}>
              {tests.testsAttempted > 0 ? `${tests.averagePercentage}%` : '—'}
            </Text>
            <Text variant="caption" style={styles.metricSub}>
              Grade {tests.gradeLetter}
            </Text>
          </Card>

          <Card variant="outlined" padding="sm" style={styles.metricTile}>
            <Text variant="caption" style={styles.metricLabel}>
              Tests Done
            </Text>
            <Text variant="heading" style={[styles.metricValue, { color: theme.colors.text.primary }]}>
              {tests.testsAttempted}/{tests.totalTests}
            </Text>
            <Text variant="caption" style={styles.metricSub}>
              Assessments
            </Text>
          </Card>
        </View>

        {/* Tab Navigation Segmented Bar */}
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

        {/* -------------------- TAB 1: OVERVIEW -------------------- */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentSection}>
            {/* Student Profile & Contact Info */}
            <Card variant="outlined" padding="md" style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text variant="heading" style={styles.sectionTitle}>
                  Contact & Information
                </Text>
                <Pressable hitSlop={8} onPress={handleOpenEdit}>
                  <Text variant="label" style={styles.linkText}>
                    Edit Info
                  </Text>
                </Pressable>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Feather name="hash" size={14} color={theme.colors.primary.main} />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text variant="caption" style={styles.infoLabel}>
                      Roll Number
                    </Text>
                    <Text variant="label" style={styles.infoValue}>
                      {student.rollNumber}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Feather name="phone" size={14} color={theme.colors.primary.main} />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text variant="caption" style={styles.infoLabel}>
                      Parent / Guardian Phone
                    </Text>
                    <Text variant="label" style={styles.infoValue}>
                      {student.parentPhone || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Feather name="mail" size={14} color={theme.colors.primary.main} />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text variant="caption" style={styles.infoLabel}>
                      Student Email
                    </Text>
                    <Text variant="label" style={styles.infoValue}>
                      {student.email || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Feather name="layers" size={14} color={theme.colors.primary.main} />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text variant="caption" style={styles.infoLabel}>
                      Assigned Batch
                    </Text>
                    <Text variant="label" style={styles.infoValue}>
                      {batch.name} • {batch.grade} ({batch.subject})
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Performance Health Card */}
            <Card variant="outlined" padding="md" style={styles.sectionCard}>
              <Text variant="heading" style={styles.sectionTitle}>
                Academic & Attendance Health
              </Text>

              <View style={styles.healthItem}>
                <View style={styles.healthIconRow}>
                  <View
                    style={[
                      styles.healthStatusDot,
                      {
                        backgroundColor:
                          attendance.percentage >= 85
                            ? theme.colors.semantic.success.main
                            : attendance.percentage >= 75
                            ? theme.colors.semantic.warning.main
                            : theme.colors.semantic.danger.main,
                      },
                    ]}
                  />
                  <Text variant="label" style={styles.healthTitle}>
                    Attendance Status: {attendance.percentage >= 85 ? 'Healthy' : attendance.percentage >= 75 ? 'Average' : 'Critical Warning'}
                  </Text>
                </View>
                <Text variant="caption" style={styles.healthDesc}>
                  {attendance.percentage >= 85
                    ? `Consistently attending classes with ${attendance.presentCount} out of ${attendance.totalClasses} days present.`
                    : `Missed ${attendance.absentCount} classes out of ${attendance.totalClasses}. Target is 85% attendance.`}
                </Text>
              </View>

              <View style={styles.healthDivider} />

              <View style={styles.healthItem}>
                <View style={styles.healthIconRow}>
                  <View
                    style={[
                      styles.healthStatusDot,
                      {
                        backgroundColor:
                          homework.completionPercentage >= 80
                            ? theme.colors.semantic.success.main
                            : theme.colors.semantic.warning.main,
                      },
                    ]}
                  />
                  <Text variant="label" style={styles.healthTitle}>
                    Homework Regularity: {homework.completionPercentage >= 80 ? 'On Track' : 'Needs Follow-up'}
                  </Text>
                </View>
                <Text variant="caption" style={styles.healthDesc}>
                  Completed {homework.doneCount} assignments. {homework.halfDoneCount + homework.notDoneCount} assignments are partial or pending.
                </Text>
              </View>
            </Card>

            {/* Recent Assessment Highlight */}
            {tests.items.length > 0 && (
              <Card variant="outlined" padding="md" style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <Text variant="heading" style={styles.sectionTitle}>
                    Latest Assessment
                  </Text>
                  <Pressable hitSlop={8} onPress={() => setActiveTab('tests')}>
                    <Text variant="label" style={styles.linkText}>
                      View All Tests →
                    </Text>
                  </Pressable>
                </View>
                {(() => {
                  const latest = tests.items[0];
                  return (
                    <View style={styles.latestTestBox}>
                      <View style={styles.latestTestHeader}>
                        <View style={{ flex: 1 }}>
                          <Text variant="label" style={styles.latestTestTitle}>
                            {latest.title}
                          </Text>
                          <Text variant="caption" style={styles.latestTestDate}>
                            Date: {latest.date}
                          </Text>
                        </View>
                        <Badge
                          label={latest.marksObtained !== null ? `${latest.marksObtained}/${latest.maxMarks}` : 'Pending'}
                          variant={latest.percentage && latest.percentage >= 75 ? 'success' : 'primary'}
                          size="md"
                        />
                      </View>
                    </View>
                  );
                })()}
              </Card>
            )}
          </View>
        )}

        {/* -------------------- TAB 2: ATTENDANCE REPORT -------------------- */}
        {activeTab === 'attendance' && (
          <View style={styles.tabContentSection}>
            {/* Summary Progress Card */}
            <Card variant="elevated" padding="md" style={styles.reportSummaryCard}>
              <View style={styles.reportSummaryHeader}>
                <View>
                  <Text variant="caption" style={styles.reportSummarySubtitle}>
                    OVERALL PRESENCE RATE
                  </Text>
                  <Text variant="heading" style={styles.reportSummaryBigNum}>
                    {attendance.percentage}%
                  </Text>
                </View>
                <Badge
                  label={
                    attendance.percentage >= 85
                      ? 'Regular'
                      : attendance.percentage >= 75
                      ? 'Average'
                      : 'Needs Improvement'
                  }
                  variant={getAttendanceVariant(attendance.percentage)}
                  size="md"
                />
              </View>

              {/* Progress visual bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, attendance.percentage))}%`,
                      backgroundColor:
                        attendance.percentage >= 85
                          ? theme.colors.semantic.success.main
                          : attendance.percentage >= 75
                          ? theme.colors.semantic.warning.main
                          : theme.colors.semantic.danger.main,
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryStatsRow}>
                <View style={styles.statCol}>
                  <Text variant="heading" style={styles.statColNum}>
                    {attendance.totalClasses}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Total Classes
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.semantic.success.main }]}
                  >
                    {attendance.presentCount}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Present Days
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.semantic.danger.main }]}
                  >
                    {attendance.absentCount}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Absent Days
                  </Text>
                </View>
              </View>
            </Card>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <Pressable
                style={[styles.filterPill, attendanceFilter === 'all' && styles.filterPillActive]}
                onPress={() => setAttendanceFilter('all')}
              >
                <Text
                  variant="caption"
                  style={[styles.filterPillText, attendanceFilter === 'all' && styles.filterPillTextActive]}
                >
                  All Logs ({attendance.history.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterPill, attendanceFilter === 'present' && styles.filterPillActive]}
                onPress={() => setAttendanceFilter('present')}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    attendanceFilter === 'present' && styles.filterPillTextActive,
                  ]}
                >
                  Present ({attendance.presentCount})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterPill, attendanceFilter === 'absent' && styles.filterPillActive]}
                onPress={() => setAttendanceFilter('absent')}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    attendanceFilter === 'absent' && styles.filterPillTextActive,
                  ]}
                >
                  Absent ({attendance.absentCount})
                </Text>
              </Pressable>
            </View>

            {/* Attendance History Roster */}
            {filteredAttendance.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No attendance records found"
                description={
                  attendanceFilter === 'all'
                    ? 'No attendance sessions have been logged for this batch yet.'
                    : `No ${attendanceFilter} days found in history.`
                }
              />
            ) : (
              <View style={styles.historyList}>
                {filteredAttendance.map((rec) => {
                  const isPresent = rec.status === 'present';
                  return (
                    <Card key={rec.id} variant="outlined" padding="sm" style={styles.historyItemCard}>
                      <View style={styles.historyItemRow}>
                        <View
                          style={[
                            styles.historyStatusCircle,
                            {
                              backgroundColor: isPresent
                                ? theme.colors.semantic.success.bg
                                : theme.colors.semantic.danger.bg,
                            },
                          ]}
                        >
                          <Feather
                            name={isPresent ? 'check' : 'x'}
                            size={16}
                            color={
                              isPresent
                                ? theme.colors.semantic.success.main
                                : theme.colors.semantic.danger.main
                            }
                          />
                        </View>

                        <View style={styles.historyTexts}>
                          <Text variant="label" style={styles.historyDateText}>
                            {formatDate(rec.date)}
                          </Text>
                          <Text variant="caption" style={styles.historyBatchText}>
                            {batch.name} • Class Session
                          </Text>
                        </View>

                        <Badge
                          label={isPresent ? 'Present' : 'Absent'}
                          variant={isPresent ? 'success' : 'danger'}
                          size="sm"
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* -------------------- TAB 3: HOMEWORK REPORT -------------------- */}
        {activeTab === 'homework' && (
          <View style={styles.tabContentSection}>
            {/* Homework Summary Card */}
            <Card variant="elevated" padding="md" style={styles.reportSummaryCard}>
              <View style={styles.reportSummaryHeader}>
                <View>
                  <Text variant="caption" style={styles.reportSummarySubtitle}>
                    HOMEWORK COMPLETION RATE
                  </Text>
                  <Text variant="heading" style={styles.reportSummaryBigNum}>
                    {homework.completionPercentage}%
                  </Text>
                </View>
                <Badge
                  label={
                    homework.completionPercentage >= 80
                      ? 'Consistent'
                      : homework.completionPercentage >= 60
                      ? 'Moderate'
                      : 'Needs Follow-up'
                  }
                  variant={homework.completionPercentage >= 80 ? 'success' : 'warning'}
                  size="md"
                />
              </View>

              {/* Progress visual bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, homework.completionPercentage))}%`,
                      backgroundColor: theme.colors.primary.main,
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryStatsRow}>
                <View style={styles.statCol}>
                  <Text variant="heading" style={styles.statColNum}>
                    {homework.totalAssigned}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Total Assigned
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.semantic.success.main }]}
                  >
                    {homework.doneCount}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Done / Submitted
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.semantic.warning.main }]}
                  >
                    {homework.halfDoneCount}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Half Done
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.semantic.danger.main }]}
                  >
                    {homework.notDoneCount}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Not Done
                  </Text>
                </View>
              </View>
            </Card>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <Pressable
                style={[styles.filterPill, homeworkFilter === 'all' && styles.filterPillActive]}
                onPress={() => setHomeworkFilter('all')}
              >
                <Text
                  variant="caption"
                  style={[styles.filterPillText, homeworkFilter === 'all' && styles.filterPillTextActive]}
                >
                  All ({homework.items.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterPill, homeworkFilter === 'done' && styles.filterPillActive]}
                onPress={() => setHomeworkFilter('done')}
              >
                <Text
                  variant="caption"
                  style={[styles.filterPillText, homeworkFilter === 'done' && styles.filterPillTextActive]}
                >
                  Completed ({homework.doneCount})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterPill, homeworkFilter === 'pending' && styles.filterPillActive]}
                onPress={() => setHomeworkFilter('pending')}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    homeworkFilter === 'pending' && styles.filterPillTextActive,
                  ]}
                >
                  Pending / Partial ({homework.halfDoneCount + homework.notDoneCount})
                </Text>
              </Pressable>
            </View>

            {/* Homework List */}
            {filteredHomework.length === 0 ? (
              <EmptyState
                icon="book-open"
                title="No homework records"
                description={
                  homeworkFilter === 'all'
                    ? 'No homework assignments created for this batch yet.'
                    : `No assignments matching '${homeworkFilter}' filter.`
                }
              />
            ) : (
              <View style={styles.historyList}>
                {filteredHomework.map((hw) => {
                  let badgeVariant: 'success' | 'warning' | 'danger' = 'success';
                  let badgeLabel = 'Done';
                  if (hw.status === 'half_done') {
                    badgeVariant = 'warning';
                    badgeLabel = 'Half Done';
                  } else if (hw.status === 'not_done') {
                    badgeVariant = 'danger';
                    badgeLabel = 'Not Done';
                  }

                  return (
                    <Card key={hw.homeworkId} variant="outlined" padding="md" style={styles.hwItemCard}>
                      <View style={styles.hwHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text variant="label" style={styles.hwTitle}>
                            {hw.title}
                          </Text>
                          <Text variant="caption" style={styles.hwDueDate}>
                            Due: {hw.dueDate}
                          </Text>
                        </View>
                        <Badge label={badgeLabel} variant={badgeVariant} size="sm" />
                      </View>

                      {hw.description ? (
                        <Text variant="caption" numberOfLines={2} style={styles.hwDesc}>
                          {hw.description}
                        </Text>
                      ) : null}

                      {hw.remarks ? (
                        <View style={styles.remarksBox}>
                          <Feather name="message-circle" size={12} color={theme.colors.text.secondary} />
                          <Text variant="caption" style={styles.remarksText}>
                            Teacher Note: {hw.remarks}
                          </Text>
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* -------------------- TAB 4: TESTS & MARKS REPORT -------------------- */}
        {activeTab === 'tests' && (
          <View style={styles.tabContentSection}>
            {/* Tests Performance Summary Card */}
            <Card variant="elevated" padding="md" style={styles.reportSummaryCard}>
              <View style={styles.reportSummaryHeader}>
                <View>
                  <Text variant="caption" style={styles.reportSummarySubtitle}>
                    OVERALL TEST AVERAGE
                  </Text>
                  <Text variant="heading" style={styles.reportSummaryBigNum}>
                    {tests.testsAttempted > 0 ? `${tests.averagePercentage}%` : 'N/A'}
                  </Text>
                </View>
                <Badge
                  label={`Grade ${tests.gradeLetter}`}
                  variant={
                    tests.averagePercentage >= 80
                      ? 'success'
                      : tests.averagePercentage >= 60
                      ? 'primary'
                      : 'warning'
                  }
                  size="md"
                />
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, tests.averagePercentage))}%`,
                      backgroundColor: '#8B5CF6',
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryStatsRow}>
                <View style={styles.statCol}>
                  <Text variant="heading" style={styles.statColNum}>
                    {tests.testsAttempted}/{tests.totalTests}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Tests Taken
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: theme.colors.primary.main }]}
                  >
                    {tests.totalMarksScored}/{tests.totalMaxMarks}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Total Marks Scored
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text
                    variant="heading"
                    style={[styles.statColNum, { color: '#8B5CF6' }]}
                  >
                    {tests.gradeLetter}
                  </Text>
                  <Text variant="caption" style={styles.statColLabel}>
                    Overall Grade
                  </Text>
                </View>
              </View>
            </Card>

            {/* Test Items List */}
            {tests.items.length === 0 ? (
              <EmptyState
                icon="award"
                title="No tests conducted yet"
                description="Create assessments and evaluate marks to generate performance reports."
              />
            ) : (
              <View style={styles.historyList}>
                {tests.items.map((test) => {
                  const hasMark = test.marksObtained !== null;
                  const pct = test.percentage ?? 0;
                  const isTop = pct >= 80;

                  return (
                    <Card key={test.testId} variant="outlined" padding="md" style={styles.testItemCard}>
                      <View style={styles.testItemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text variant="label" style={styles.testTitleText}>
                            {test.title}
                          </Text>
                          <Text variant="caption" style={styles.testDateText}>
                            Conducted: {test.date}
                          </Text>
                        </View>
                        <Badge
                          label={test.gradeBadge}
                          variant={isTop ? 'success' : hasMark ? 'primary' : 'neutral'}
                          size="sm"
                        />
                      </View>

                      <View style={styles.testScoreBox}>
                        <View style={styles.testScoreMain}>
                          <Text variant="caption" style={styles.testScoreLabel}>
                            Marks Scored
                          </Text>
                          <Text variant="heading" style={styles.testScoreNum}>
                            {hasMark ? test.marksObtained : '—'}
                            <Text variant="body" style={styles.testScoreMax}>
                              {' '}
                              / {test.maxMarks}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.testPctBox}>
                          <Text variant="caption" style={styles.testScoreLabel}>
                            Percentage
                          </Text>
                          <Text
                            variant="label"
                            style={[
                              styles.testPctValue,
                              {
                                color: isTop
                                  ? theme.colors.semantic.success.main
                                  : theme.colors.primary.main,
                              },
                            ]}
                          >
                            {hasMark ? `${test.percentage}%` : 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {hasMark && (
                        <View style={styles.testBarTrack}>
                          <View
                            style={[
                              styles.testBarFill,
                              {
                                width: `${Math.min(100, Math.max(0, pct))}%`,
                                backgroundColor: isTop
                                  ? theme.colors.semantic.success.main
                                  : theme.colors.primary.main,
                              },
                            ]}
                          />
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* EDIT STUDENT MODAL */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalBackdropTouch} onPress={() => setIsEditModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text variant="heading" style={styles.modalSheetTitle}>
                  Edit Student Details
                </Text>
                <Text variant="caption" style={styles.modalSheetSub}>
                  {batch.name} • {batch.grade}
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.modalCloseBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Student Full Name *"
                placeholder="e.g. Aarav Sharma"
                value={editName}
                onChangeText={(text) => {
                  setEditName(text);
                  if (editErrors.name) setEditErrors((e) => ({ ...e, name: undefined }));
                }}
                error={editErrors.name}
                leftContent={<Feather name="user" size={16} color={theme.colors.text.secondary} />}
              />

              <Input
                label="Roll Number / Student ID *"
                placeholder="e.g. 101"
                value={editRoll}
                onChangeText={(text) => {
                  setEditRoll(text);
                  if (editErrors.roll) setEditErrors((e) => ({ ...e, roll: undefined }));
                }}
                error={editErrors.roll}
                keyboardType="numeric"
                leftContent={<Feather name="hash" size={16} color={theme.colors.text.secondary} />}
              />

              <Input
                label="Parent / Guardian Phone"
                placeholder="e.g. +91 98765 43210"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                leftContent={<Feather name="phone" size={16} color={theme.colors.text.secondary} />}
                helperText="For attendance SMS alerts and WhatsApp reports"
              />

              <Input
                label="Student Email (Optional)"
                placeholder="e.g. student@school.edu"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftContent={<Feather name="mail" size={16} color={theme.colors.text.secondary} />}
              />

              <View style={styles.modalBtnRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    fullWidth
                    onPress={() => setIsEditModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title="Save Changes"
                    variant="primary"
                    fullWidth
                    loading={isSubmittingEdit}
                    onPress={handleSaveEdit}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: theme.colors.background.screen,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
    backgroundColor: theme.colors.background.screen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 16,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
  },
  avatarText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 20,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  // Contact Action Strip
  contactActionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.md,
    padding: 8,
    gap: 8,
  },
  contactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.radii.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  contactPillDisabled: {
    opacity: 0.45,
  },
  contactIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPillLabel: {
    fontWeight: '600',
    fontSize: 11,
    color: theme.colors.text.primary,
  },

  // 4 Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    color: theme.colors.text.disabled,
    textAlign: 'center',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderRadius: theme.radii.sm,
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

  // Tab Content
  tabContentSection: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  linkText: {
    color: theme.colors.primary.main,
    fontSize: 12,
    fontWeight: '600',
  },

  // Info list
  infoList: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Health
  healthItem: {
    gap: 4,
  },
  healthIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  healthDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  healthDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: 4,
  },

  // Latest test box
  latestTestBox: {
    backgroundColor: theme.colors.background.screen,
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  latestTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestTestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  latestTestDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },

  // Report Summary Card
  reportSummaryCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 12,
  },
  reportSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportSummarySubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: theme.colors.text.secondary,
  },
  reportSummaryBigNum: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: theme.colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statColNum: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statColLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border.main,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterPillTextActive: {
    color: theme.colors.text.inverse,
  },

  // History List
  historyList: {
    gap: 8,
  },
  historyItemCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyStatusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTexts: {
    flex: 1,
  },
  historyDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  historyBatchText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },

  // Homework items
  hwItemCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  hwHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  hwTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  hwDueDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  hwDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.screen,
    padding: 8,
    borderRadius: theme.radii.sm,
    marginTop: 4,
  },
  remarksText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    flex: 1,
  },

  // Tests items
  testItemCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    gap: 10,
  },
  testItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  testTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  testDateText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  testScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    padding: 10,
    borderRadius: theme.radii.sm,
  },
  testScoreMain: {
    gap: 2,
  },
  testScoreLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  testScoreNum: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  testScoreMax: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: 'normal',
  },
  testPctBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  testPctValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  testBarTrack: {
    height: 6,
    backgroundColor: theme.colors.border.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  testBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '85%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSheetSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  formScrollContent: {
    padding: 20,
    gap: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
