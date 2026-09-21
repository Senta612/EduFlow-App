import React, { useMemo } from 'react';
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
import { Batch, Student } from '@/types/teacher';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export interface EnrolledStudentItem extends Student {
  batchId: string;
  batchName: string;
  batchSubject: string;
  batchGrade: string;
}

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface EnrolledStudentsModalProps {
  visible: boolean;
  onClose: () => void;
  batches: Batch[];
  allStudents: EnrolledStudentItem[];
  searchQuery: string;
  onChangeSearchQuery: (text: string) => void;
  selectedBatchFilter: string;
  onSelectBatchFilter: (batchId: string) => void;
  onCallParent: (phone?: string) => void;
  onSelectStudent: (student: EnrolledStudentItem) => void;
}

export const EnrolledStudentsModal: React.FC<EnrolledStudentsModalProps> = ({
  visible,
  onClose,
  batches,
  allStudents,
  searchQuery,
  onChangeSearchQuery,
  selectedBatchFilter,
  onSelectBatchFilter,
  onCallParent,
  onSelectStudent,
}) => {
  const { t } = useTranslation();
  const totalStudents = allStudents.length;

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchBatch =
        selectedBatchFilter === 'all' || s.batchId === selectedBatchFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.batchName.toLowerCase().includes(q) ||
        s.batchSubject.toLowerCase().includes(q);

      return matchBatch && matchQuery;
    });
  }, [allStudents, selectedBatchFilter, searchQuery]);

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
                {t('reports.enrolledDirectory')}
              </Text>
              <Text variant="caption" style={styles.modalSubtitle}>
                {filteredStudents.length} / {totalStudents} {t('common.students')}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={onClose}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={styles.searchWrap}>
            <Input
              placeholder={t('reports.searchPlaceholder')}
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

          {/* Batch Filter Chips */}
          <View style={styles.filterChipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContent}
            >
              <Pressable
                style={[
                  styles.filterChip,
                  selectedBatchFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => onSelectBatchFilter('all')}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.filterChipText,
                    selectedBatchFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  {t('reports.allBatchesWithCount').replace('{count}', String(totalStudents))}
                </Text>
              </Pressable>

              {batches.map((b) => {
                const count = allStudents.filter((s) => s.batchId === b.id).length;
                const isSelected = selectedBatchFilter === b.id;
                return (
                  <Pressable
                    key={b.id}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                    ]}
                    onPress={() => onSelectBatchFilter(b.id)}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {b.subject} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <View style={styles.modalEmptyWrap}>
              <EmptyState
                icon="users"
                title={searchQuery ? t('reports.noStudentsFound').replace('{query}', searchQuery) : t('reports.noStudentsInBatch')}
                description={
                  searchQuery
                    ? t('reports.noStudentsFound').replace('{query}', searchQuery)
                    : t('reports.noStudentsInBatch')
                }
                actionLabel={searchQuery ? t('reports.clearSearch') : undefined}
                onAction={searchQuery ? () => onChangeSearchQuery('') : undefined}
              />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.studentsListScroll}
              keyboardShouldPersistTaps="handled"
            >
              {filteredStudents.map((student) => (
                <Card
                  key={`${student.batchId}-${student.id}`}
                  variant="outlined"
                  padding="none"
                  style={styles.studentRosterCard}
                >
                  <Pressable
                    style={styles.studentRosterPressable}
                    onPress={() => onSelectStudent(student)}
                  >
                    {/* Avatar */}
                    <View style={styles.studentAvatar}>
                      <Text variant="label" style={styles.studentAvatarText}>
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
                          label={`${t('reports.rollNo')} #${student.rollNumber}`}
                          variant="neutral"
                          size="sm"
                        />
                      </View>

                      <View style={styles.studentMetaLine}>
                        <Badge
                          label={`${student.batchName} • ${student.batchGrade}`}
                          variant="primary"
                          size="sm"
                        />
                      </View>
                    </View>

                    {/* Call Button & Chevron */}
                    <View style={styles.studentActionsGroup}>
                      {student.parentPhone ? (
                        <Pressable
                          hitSlop={8}
                          style={styles.quickCallBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            onCallParent(student.parentPhone);
                          }}
                        >
                          <Feather
                            name="phone"
                            size={14}
                            color={theme.colors.semantic.success.main}
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
              ))}
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
  searchWrap: {
    paddingHorizontal: 20,
  },
  filterChipsRow: {
    maxHeight: 36,
  },
  filterChipsContent: {
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
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: theme.colors.primary.main,
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
    backgroundColor: theme.colors.semantic.success.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
