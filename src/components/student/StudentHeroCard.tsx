import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Student, Batch } from '@/types/teacher';
import { theme } from '@/theme';

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface StudentHeroCardProps {
  student: Student;
  batch: Batch;
  onCallParent: (phone?: string) => void;
  onMessageParent: (phone?: string) => void;
  onEmailStudent: (email?: string) => void;
}

export const StudentHeroCard: React.FC<StudentHeroCardProps> = ({
  student,
  batch,
  onCallParent,
  onMessageParent,
  onEmailStudent,
}) => {
  return (
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
          onPress={() => onCallParent(student.parentPhone)}
        >
          <View
            style={[
              styles.contactIconCircle,
              { backgroundColor: theme.colors.semantic.success.bg },
            ]}
          >
            <Feather name="phone" size={14} color={theme.colors.semantic.success.main} />
          </View>
          <Text variant="caption" style={styles.contactPillLabel}>
            Call Parent
          </Text>
        </Pressable>

        <Pressable
          style={[styles.contactPill, !student.parentPhone && styles.contactPillDisabled]}
          onPress={() => onMessageParent(student.parentPhone)}
        >
          <View
            style={[
              styles.contactIconCircle,
              { backgroundColor: theme.colors.primary.bg },
            ]}
          >
            <Feather name="message-square" size={14} color={theme.colors.primary.main} />
          </View>
          <Text variant="caption" style={styles.contactPillLabel}>
            SMS / Chat
          </Text>
        </Pressable>

        <Pressable
          style={[styles.contactPill, !student.email && styles.contactPillDisabled]}
          onPress={() => onEmailStudent(student.email)}
        >
          <View
            style={[
              styles.contactIconCircle,
              { backgroundColor: '#F3E8FF' },
            ]}
          >
            <Feather name="mail" size={14} color="#7E22CE" />
          </View>
          <Text variant="caption" style={styles.contactPillLabel}>
            Email
          </Text>
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contactActionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    gap: 8,
  },
  contactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.screen,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  contactPillDisabled: {
    opacity: 0.4,
  },
  contactIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
});
