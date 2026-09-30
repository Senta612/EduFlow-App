import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TaskType } from '@/types/teacher';
import { theme } from '@/theme';

interface TaskTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: TaskType) => void;
}

interface TaskOption {
  type: TaskType;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
}

const TASK_OPTIONS: TaskOption[] = [
  {
    type: 'attendance',
    title: 'Mark Attendance',
    subtitle: 'Record present & absent statuses for today',
    badge: 'Attendance',
    icon: 'check-square',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    type: 'homework',
    title: 'Assign Homework',
    subtitle: 'Create a new homework task with a due date',
    badge: 'Homework',
    icon: 'book-open',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    type: 'marks',
    title: 'Record Test Marks',
    subtitle: 'Create a test & record student exam marks',
    badge: 'Test Marks',
    icon: 'award',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
];

export const TaskTypeModal: React.FC<TaskTypeModalProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
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
          accessibilityLabel="Close task selection modal"
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Feather name="plus-circle" size={20} color={theme.colors.primary.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={styles.modalTitle}>
                  Start / Create Task
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  Choose the activity you would like to perform
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {TASK_OPTIONS.map((option) => (
              <Card
                key={option.type}
                variant="outlined"
                padding="none"
                style={styles.optionCard}
              >
                <Pressable
                  style={styles.optionCardInner}
                  onPress={() => {
                    onClose();
                    onSelectType(option.type);
                  }}
                  android_ripple={{ color: '#F1F5F9' }}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: option.iconBg }]}>
                    <Feather name={option.icon} size={20} color={option.iconColor} />
                  </View>

                  <View style={styles.optionTextContainer}>
                    <View style={styles.optionTitleRow}>
                      <Text variant="label" style={styles.optionTitle}>
                        {option.title}
                      </Text>
                      <Badge label={option.badge} variant="neutral" size="sm" />
                    </View>
                    <Text variant="caption" style={styles.optionSubtitle}>
                      {option.subtitle}
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={18} color={theme.colors.text.secondary} />
                </Pressable>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderColor: theme.colors.border.light,
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 14,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});
