import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Student } from '@/types/teacher';
import { theme } from '@/theme';

interface StudentFormModalProps {
  visible: boolean;
  onClose: () => void;
  editingStudent: Student | null;
  formName: string;
  onChangeName: (text: string) => void;
  formRoll: string;
  onChangeRoll: (text: string) => void;
  formPhone: string;
  onChangePhone: (text: string) => void;
  formEmail: string;
  onChangeEmail: (text: string) => void;
  errors: { name?: string; roll?: string };
  isSubmitting: boolean;
  onSave: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  visible,
  onClose,
  editingStudent,
  formName,
  onChangeName,
  formRoll,
  onChangeRoll,
  formPhone,
  onChangePhone,
  formEmail,
  onChangeEmail,
  errors,
  isSubmitting,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="heading" style={styles.modalTitle}>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </Text>
            <Text variant="caption" style={styles.modalSubtitle}>
              {editingStudent
                ? 'Update student details and parent contact info'
                : 'Enter student information to enroll them in this batch'}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScroll}
          >
            <Input
              label="Student Full Name *"
              placeholder="e.g. Alex Johnson"
              value={formName}
              onChangeText={onChangeName}
              error={errors.name}
            />

            <Input
              label="Roll / ID Number *"
              placeholder="e.g. 101"
              value={formRoll}
              onChangeText={onChangeRoll}
              keyboardType="numeric"
              error={errors.roll}
            />

            <Input
              label="Parent / Guardian Phone"
              placeholder="e.g. +1 555-0199"
              value={formPhone}
              onChangeText={onChangePhone}
              keyboardType="phone-pad"
            />

            <Input
              label="Student Email (Optional)"
              placeholder="e.g. student@school.edu"
              value={formEmail}
              onChangeText={onChangeEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              style={styles.actionBtn}
              onPress={onClose}
              disabled={isSubmitting}
            />
            <Button
              title={
                isSubmitting
                  ? 'Saving...'
                  : editingStudent
                  ? 'Save Changes'
                  : 'Add Student'
              }
              variant="primary"
              style={styles.actionBtn}
              onPress={onSave}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    maxHeight: '85%',
    gap: 16,
  },
  modalHeader: {
    gap: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  formScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
