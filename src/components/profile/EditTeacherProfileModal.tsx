import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Profile } from '@/types/profile';
import { theme } from '@/theme';

interface EditTeacherProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: (updates: Partial<Profile>) => Promise<void>;
}

export function EditTeacherProfileModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditTeacherProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string }>({});

  useEffect(() => {
    if (visible && profile) {
      setFullName(profile.full_name || '');
      setInstituteName(profile.institute_name || 'EduFlow Coaching Academy');
      setSpecialization(profile.specialization || 'Class 10-12 Mathematics & Physics Expert');
      setPhone(profile.phone || '+91 98765 43210');
      setQualifications(profile.qualifications || 'M.Sc. Mathematics • 8+ Years Experience');
      setBio(
        profile.bio ||
          'Dedicated educator passionate about simplifying concepts and driving student excellence.',
      );
      setErrors({});
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrors({ fullName: 'Full name is required' });
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        full_name: fullName.trim(),
        institute_name: instituteName.trim(),
        specialization: specialization.trim(),
        phone: phone.trim() || null,
        qualifications: qualifications.trim(),
        bio: bio.trim(),
      });
      onClose();
    } catch {
      Alert.alert('Save Failed', 'Unable to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBox}>
                  <Feather name="edit-3" size={18} color={theme.colors.primary.main} />
                </View>
                <View>
                  <Text variant="label" style={styles.modalTitle}>
                    Edit Teacher Profile
                  </Text>
                  <Text variant="caption" style={styles.modalSubtitle}>
                    Update institute branding & teaching details
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Edit Profile Modal"
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Full Name *"
                placeholder="e.g. Prof. Rajesh Sharma"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({});
                }}
                error={errors.fullName}
                leftContent={
                  <Feather name="user" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Tuition / Institute Center Name"
                placeholder="e.g. EduFlow Coaching Academy"
                value={instituteName}
                onChangeText={setInstituteName}
                leftContent={
                  <Feather name="home" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Subject Specialization"
                placeholder="e.g. Class 10-12 Mathematics & Physics"
                value={specialization}
                onChangeText={setSpecialization}
                leftContent={
                  <Feather name="book-open" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Phone / WhatsApp Contact"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftContent={
                  <Feather name="phone" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="Qualifications & Teaching Experience"
                placeholder="e.g. M.Sc. Mathematics • 8+ Years Experience"
                value={qualifications}
                onChangeText={setQualifications}
                leftContent={
                  <Feather name="award" size={16} color={theme.colors.text.secondary} />
                }
              />

              <Input
                label="About / Teaching Philosophy"
                placeholder="Brief bio or teaching summary..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                leftContent={
                  <Feather name="file-text" size={16} color={theme.colors.text.secondary} />
                }
              />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
              <Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                variant="primary"
                onPress={handleSave}
                loading={isSaving}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '92%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
});
