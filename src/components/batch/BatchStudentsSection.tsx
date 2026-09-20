import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Student } from '@/types/teacher';
import { theme } from '@/theme';

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface BatchStudentsSectionProps {
  students: Student[];
  onOpenAddStudent: () => void;
  onOpenProfile: (student: Student) => void;
  onOpenEditStudent: (student: Student) => void;
}

export const BatchStudentsSection: React.FC<BatchStudentsSectionProps> = ({
  students,
  onOpenAddStudent,
  onOpenProfile,
  onOpenEditStudent,
}) => {
  return (
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
          onPress={onOpenAddStudent}
        />
      </View>

      {students.length === 0 ? (
        <EmptyState
          icon="users"
          title="No students enrolled yet"
          description="Add students to this batch to track attendance, homework, and test marks."
          actionLabel="+ Add First Student"
          onAction={onOpenAddStudent}
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
                onPress={() => onOpenProfile(student)}
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
                      onOpenEditStudent(student);
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
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: theme.spacing.lg,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  studentsListContainer: {
    gap: 8,
  },
  studentCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  studentAvatarBox: {
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
    fontSize: 14,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  studentMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentPhone: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  studentNoPhone: {
    fontSize: 11,
    color: theme.colors.text.disabled,
    fontStyle: 'italic',
  },
  studentEmailShort: {
    fontSize: 11,
    color: theme.colors.text.disabled,
    maxWidth: 120,
  },
  studentActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentRowEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
