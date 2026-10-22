import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FeeStatusBadge } from '@/components/ui/FeeStatusBadge';
import { Student, Batch, FeeStatus } from '@/types/teacher';
import { theme } from '@/theme';

interface UpdateFeeStatusModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student | null;
  batch: Batch | null;
  currentStatus?: FeeStatus;
  isSubmitting?: boolean;
  onSaveStatus: (status: FeeStatus) => Promise<void> | void;
}

interface StatusItemConfig {
  status: FeeStatus;
  title: string;
  badgeLabel: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
  border: string;
}

const STATUS_CONFIGS: StatusItemConfig[] = [
  {
    status: 'paid',
    title: 'Fees Paid',
    badgeLabel: 'Paid',
    description: 'All fees have been cleared and settled in full.',
    icon: 'check-circle',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#86EFAC',
  },
  {
    status: 'pending',
    title: 'Payment Pending',
    badgeLabel: 'Pending',
    description: 'Fees are due or awaited from the parent/guardian.',
    icon: 'clock',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FCD34D',
  },
  {
    status: 'overdue',
    title: 'Payment Overdue',
    badgeLabel: 'Overdue',
    description: 'Fee payment has exceeded the due date.',
    icon: 'alert-circle',
    color: '#B91C1C',
    bg: '#FEE2E2',
    border: '#FCA5A5',
  },
  {
    status: 'free',
    title: 'Free / Scholarship',
    badgeLabel: 'Free',
    description: '100% concession, merit scholarship, or free seat.',
    icon: 'award',
    color: '#6D28D9',
    bg: '#EDE9FE',
    border: '#C4B5FD',
  },
];

export const UpdateFeeStatusModal: React.FC<UpdateFeeStatusModalProps> = ({
  visible,
  onClose,
  student,
  batch,
  currentStatus = 'pending',
  isSubmitting = false,
  onSaveStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FeeStatus>(currentStatus);

  useEffect(() => {
    if (visible) {
      setSelectedStatus(student?.feeStatus || currentStatus || 'pending');
    }
  }, [visible, student, currentStatus]);

  if (!student) return null;

  const handleConfirm = () => {
    onSaveStatus(selectedStatus);
  };

  const selectedConfig = STATUS_CONFIGS.find((s) => s.status === selectedStatus) || STATUS_CONFIGS[1];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.modalBackdropTouch}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss status modal"
        />

        <View style={styles.sheetContainer}>
          {/* Top Drag Indicator Handle */}
          <View style={styles.dragIndicatorHandle} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatarBox}>
                <Text variant="label" style={styles.headerAvatarText}>
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerTitleGroup}>
                <Text variant="heading" style={styles.title}>
                  Update Fee Status
                </Text>
                <Text variant="caption" style={styles.subtitle}>
                  {student.name} • Roll #{student.rollNumber}
                  {batch ? ` • ${batch.name}` : ''}
                </Text>
              </View>
            </View>

            <Pressable
              hitSlop={10}
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Current Status Pill */}
          <View style={styles.currentStatusStrip}>
            <Text variant="caption" style={styles.currentStatusLabel}>
              Current Status:
            </Text>
            <FeeStatusBadge status={student.feeStatus || 'pending'} size="sm" />
          </View>

          {/* Status Selection Cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.statusList}
          >
            {STATUS_CONFIGS.map((config) => {
              const isSelected = selectedStatus === config.status;
              return (
                <Pressable
                  key={config.status}
                  style={[
                    styles.statusCard,
                    isSelected && {
                      backgroundColor: config.bg,
                      borderColor: config.color,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setSelectedStatus(config.status)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${config.title}: ${config.description}`}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected ? '#FFFFFF' : config.bg,
                      },
                    ]}
                  >
                    <Feather
                      name={config.icon}
                      size={18}
                      color={config.color}
                    />
                  </View>

                  <View style={styles.statusMeta}>
                    <View style={styles.statusTitleRow}>
                      <Text
                        variant="label"
                        style={[
                          styles.statusTitle,
                          isSelected && { color: config.color, fontWeight: '700' },
                        ]}
                      >
                        {config.title}
                      </Text>
                      <Badge
                        label={config.badgeLabel}
                        variant={
                          config.status === 'paid'
                            ? 'success'
                            : config.status === 'free'
                            ? 'purple'
                            : config.status === 'overdue'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      />
                    </View>
                    <Text variant="caption" style={styles.statusDescription}>
                      {config.description}
                    </Text>
                  </View>

                  {/* Radio Checkmark */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && {
                        backgroundColor: config.color,
                        borderColor: config.color,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={12} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="outline"
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? 'Updating...' : `Set as ${selectedConfig.badgeLabel}`}
              variant="primary"
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    selectedConfig.status === 'paid'
                      ? '#16A34A'
                      : selectedConfig.status === 'free'
                      ? '#7C3AED'
                      : selectedConfig.status === 'overdue'
                      ? '#DC2626'
                      : '#D97706',
                },
              ]}
              icon="check"
              onPress={handleConfirm}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  dragIndicatorHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border.main,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  headerAvatarText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 16,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  currentStatusLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  statusList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: theme.colors.background.paper,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMeta: {
    flex: 1,
    gap: 2,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusDescription: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.5,
  },
});
