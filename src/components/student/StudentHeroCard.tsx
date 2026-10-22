import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FeeStatusBadge } from '@/components/ui/FeeStatusBadge';
import { Student, Batch } from '@/types/teacher';
import { useTeacherPreferences } from '@/providers';
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
  onSharePortalAccess?: () => void;
  onPressFeeStatus?: () => void;
}

export const StudentHeroCard: React.FC<StudentHeroCardProps> = ({
  student,
  batch,
  onCallParent,
  onMessageParent,
  onEmailStudent,
  onSharePortalAccess,
  onPressFeeStatus,
}) => {
  const { isFeeStatusEnabled } = useTeacherPreferences();
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
            {isFeeStatusEnabled && (
              <Pressable
                hitSlop={8}
                style={styles.heroFeeBadgePressable}
                onPress={onPressFeeStatus}
                accessibilityRole="button"
                accessibilityLabel="Change fee status"
              >
                <FeeStatusBadge status={student.feeStatus || 'pending'} size="sm" />
                <Feather
                  name="chevron-down"
                  size={11}
                  color={theme.colors.text.secondary}
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Share Student Portal Access Button */}
      {onSharePortalAccess && (
        <Pressable
          style={styles.portalShareBanner}
          onPress={onSharePortalAccess}
        >
          <View style={styles.portalShareLeft}>
            <View style={styles.portalShareIcon}>
              <Feather name="send" size={14} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label" style={styles.portalShareTitle}>
                Student Portal Direct Access
              </Text>
              <Text variant="caption" style={styles.portalShareSubtitle}>
                Invite code: {student.inviteCode || `STU-${student.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`} • No login needed
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color="#059669" />
        </Pressable>
      )}

      {/* Dedicated Interactive Fee Status Strip */}
      {isFeeStatusEnabled && (
        <Pressable
          style={styles.feeStatusHeroStrip}
          onPress={onPressFeeStatus}
          accessibilityRole="button"
          accessibilityLabel="Update student fee status"
        >
          <View style={styles.feeStatusStripLeft}>
            <View
              style={[
                styles.feeStatusIconCircle,
                {
                  backgroundColor:
                    student.feeStatus === 'paid'
                      ? '#DCFCE7'
                      : student.feeStatus === 'free'
                      ? '#EDE9FE'
                      : student.feeStatus === 'overdue'
                      ? '#FEE2E2'
                      : '#FEF3C7',
                },
              ]}
            >
              <Feather
                name={
                  student.feeStatus === 'paid'
                    ? 'check-circle'
                    : student.feeStatus === 'free'
                    ? 'award'
                    : student.feeStatus === 'overdue'
                    ? 'alert-circle'
                    : 'clock'
                }
                size={14}
                color={
                  student.feeStatus === 'paid'
                    ? '#15803D'
                    : student.feeStatus === 'free'
                    ? '#6D28D9'
                    : student.feeStatus === 'overdue'
                    ? '#B91C1C'
                    : '#B45309'
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.feeStatusTitleRow}>
                <Text variant="label" style={styles.feeStatusStripTitle}>
                  Fee Status
                </Text>
                <FeeStatusBadge status={student.feeStatus || 'pending'} size="sm" />
              </View>
              <Text variant="caption" style={styles.feeStatusStripSubtitle}>
                {student.feeStatus === 'paid'
                  ? 'Fees fully cleared • Tap to update'
                  : student.feeStatus === 'free'
                  ? 'Free seat / concession • Tap to update'
                  : student.feeStatus === 'overdue'
                  ? 'Payment delayed • Tap to update'
                  : 'Fee payment pending • Tap to update'}
              </Text>
            </View>
          </View>

          <View style={styles.feeStatusUpdateChip}>
            <Text variant="caption" style={styles.feeStatusUpdateText}>
              Update
            </Text>
            <Feather name="chevron-right" size={13} color={theme.colors.primary.main} />
          </View>
        </Pressable>
      )}

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
  portalShareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: theme.radii.lg,
    padding: 10,
    gap: 10,
  },
  portalShareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  portalShareIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalShareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  portalShareSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
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
  heroFeeBadgePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  feeStatusHeroStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radii.lg,
    padding: 10,
    gap: 10,
  },
  feeStatusStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  feeStatusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeStatusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeStatusStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  feeStatusStripSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  feeStatusUpdateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  feeStatusUpdateText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
});
