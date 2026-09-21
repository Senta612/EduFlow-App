import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { AttendanceRecord, Batch, Student } from '@/types/teacher';
import { theme } from '@/theme';

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRecordDate(dateStr: string): string {
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

interface AttendanceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  batch: Batch | null;
  students: Student[];
  filter: 'all' | 'present' | 'absent';
  onChangeFilter: (f: 'all' | 'present' | 'absent') => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onCallParent: (phone?: string) => void;
  onSelectStudent: (student: Student) => void;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  visible,
  onClose,
  record,
  batch,
  students,
  filter,
  onChangeFilter,
  searchQuery,
  onChangeSearchQuery,
  onCallParent,
  onSelectStudent,
}) => {
  if (!record || !batch) return null;

  const total = record.totalStudents || 1;
  const attendanceRate = Math.round((record.presentCount / total) * 100);

  const studentAttendanceList = students.map((s) => {
    const recItem = record.records?.find((r) => r.studentId === s.id);
    const status = recItem?.status || 'present';
    return {
      ...s,
      status,
    };
  });

  const filteredStudentRoster = studentAttendanceList.filter((s) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'present' && s.status === 'present') ||
      (filter === 'absent' && s.status === 'absent');

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q);

    return matchFilter && matchQuery;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalBackdropTouch} onPress={onClose} />
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text variant="title" style={styles.modalTitle}>
                Attendance Session Details
              </Text>
              <Text variant="caption" style={styles.modalSubtitle}>
                {formatRecordDate(record.date)} • {batch.name}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose} style={styles.modalCloseBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Session Overview Stats */}
          <View style={styles.sessionStatsStrip}>
            <View style={styles.sessionStatCol}>
              <Text variant="caption" style={styles.sessionStatLabel}>
                Attendance
              </Text>
              <Text
                variant="heading"
                style={[
                  styles.sessionStatVal,
                  {
                    color:
                      attendanceRate >= 85
                        ? theme.colors.semantic.success.main
                        : theme.colors.semantic.warning.main,
                  },
                ]}
              >
                {attendanceRate}%
              </Text>
            </View>

            <View style={styles.sessionStatDivider} />

            <View style={styles.sessionStatCol}>
              <Text variant="caption" style={styles.sessionStatLabel}>
                Present
              </Text>
              <Text
                variant="heading"
                style={[
                  styles.sessionStatVal,
                  { color: theme.colors.semantic.success.main },
                ]}
              >
                {record.presentCount}
              </Text>
            </View>

            <View style={styles.sessionStatDivider} />

            <View style={styles.sessionStatCol}>
              <Text variant="caption" style={styles.sessionStatLabel}>
                Absent
              </Text>
              <Text
                variant="heading"
                style={[
                  styles.sessionStatVal,
                  { color: theme.colors.semantic.danger.main },
                ]}
              >
                {record.absentCount}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrap}>
            <Input
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChangeText={onChangeSearchQuery}
              leftContent={<Feather name="search" size={16} color={theme.colors.text.secondary} />}
              rightContent={
                searchQuery ? (
                  <Pressable hitSlop={8} onPress={() => onChangeSearchQuery('')}>
                    <Feather name="x-circle" size={16} color={theme.colors.text.secondary} />
                  </Pressable>
                ) : undefined
              }
            />
          </View>

          {/* Presence Filter Chips */}
          <View style={styles.filterChipsRow}>
            <Pressable
              style={[
                styles.filterChip,
                filter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => onChangeFilter('all')}
            >
              <Text
                variant="caption"
                style={[
                  styles.filterChipText,
                  filter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All Students ({studentAttendanceList.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                filter === 'present' && styles.filterChipActive,
              ]}
              onPress={() => onChangeFilter('present')}
            >
              <Text
                variant="caption"
                style={[
                  styles.filterChipText,
                  filter === 'present' && styles.filterChipTextActive,
                ]}
              >
                Present ({record.presentCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                filter === 'absent' && styles.filterChipActive,
              ]}
              onPress={() => onChangeFilter('absent')}
            >
              <Text
                variant="caption"
                style={[
                  styles.filterChipText,
                  filter === 'absent' && styles.filterChipTextActive,
                ]}
              >
                Absent ({record.absentCount})
              </Text>
            </Pressable>
          </View>

          {/* Student Roster List */}
          {filteredStudentRoster.length === 0 ? (
            <View style={styles.modalEmptyWrap}>
              <EmptyState
                icon="users"
                title="No students matched"
                description={
                  searchQuery
                    ? `No students found matching "${searchQuery}".`
                    : 'No students found for the selected filter.'
                }
                actionLabel={searchQuery ? 'Clear Search' : undefined}
                onAction={searchQuery ? () => onChangeSearchQuery('') : undefined}
              />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.studentsListScroll}
              keyboardShouldPersistTaps="handled"
            >
              {filteredStudentRoster.map((student) => {
                const isPresent = student.status === 'present';
                return (
                  <Card
                    key={student.id}
                    variant="outlined"
                    padding="none"
                    style={styles.studentRosterCard}
                  >
                    <Pressable
                      style={styles.studentRosterPressable}
                      onPress={() => {
                        onClose();
                        onSelectStudent(student);
                      }}
                    >
                      {/* Avatar */}
                      <View
                        style={[
                          styles.studentAvatar,
                          {
                            backgroundColor: isPresent
                              ? theme.colors.semantic.success.bg
                              : theme.colors.semantic.danger.bg,
                            borderColor: isPresent
                              ? theme.colors.semantic.success.main
                              : theme.colors.semantic.danger.main,
                          },
                        ]}
                      >
                        <Text
                          variant="label"
                          style={[
                            styles.studentAvatarText,
                            {
                              color: isPresent
                                ? theme.colors.semantic.success.main
                                : theme.colors.semantic.danger.main,
                            },
                          ]}
                        >
                          {getInitials(student.name)}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={styles.studentMainInfo}>
                        <View style={styles.studentTitleRow}>
                          <Text variant="label" style={styles.studentFullName}>
                            {student.name}
                          </Text>
                          <Badge
                            label={`Roll #${student.rollNumber}`}
                            variant="neutral"
                            size="sm"
                          />
                        </View>

                        <View style={styles.studentMetaLine}>
                          <Badge
                            label={isPresent ? 'Present' : 'Absent'}
                            variant={isPresent ? 'success' : 'danger'}
                            icon={isPresent ? 'check' : 'x'}
                            size="sm"
                          />
                        </View>
                      </View>

                      {/* Call Button for Absent Students & Chevron */}
                      <View style={styles.studentActionsGroup}>
                        {!isPresent && student.parentPhone ? (
                          <Pressable
                            hitSlop={8}
                            style={styles.quickCallBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              onCallParent(student.parentPhone);
                            }}
                          >
                            <Feather
                              name="phone-call"
                              size={14}
                              color={theme.colors.semantic.danger.main}
                            />
                          </Pressable>
                        ) : null}
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={theme.colors.text.disabled}
                        />
                      </View>
                    </Pressable>
                  </Card>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  sessionStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background.screen,
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  sessionStatCol: {
    alignItems: 'center',
    gap: 2,
  },
  sessionStatLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  sessionStatVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  sessionStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border.main,
  },
  searchWrap: {
    paddingHorizontal: 20,
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  modalEmptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  studentsListScroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 8,
  },
  studentRosterCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  studentRosterPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentMainInfo: {
    flex: 1,
    gap: 4,
  },
  studentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  studentMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.semantic.danger.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
