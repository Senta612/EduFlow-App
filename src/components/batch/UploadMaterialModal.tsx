import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StudyMaterialCategory } from '@/types/teacher';
import { detectFileType } from '@/services/teacher/materials.service';
import { theme } from '@/theme';

interface UploadMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  batchId: string;
  defaultSubject?: string;
  onUploadSuccess: () => void;
}

interface PickedDocument {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

const CATEGORIES: { key: StudyMaterialCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'notes', label: 'Notes', icon: 'book' },
  { key: 'formula_sheet', label: 'Formula Sheet', icon: 'code' },
  { key: 'question_bank', label: 'Question Bank', icon: 'help-circle' },
  { key: 'syllabus', label: 'Syllabus', icon: 'list' },
  { key: 'assignment', label: 'Assignment', icon: 'file-text' },
  { key: 'other', label: 'Other', icon: 'folder' },
];

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  visible,
  onClose,
  batchId,
  defaultSubject = '',
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<PickedDocument | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [category, setCategory] = useState<StudyMaterialCategory>('notes');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Sync subject when modal opens with defaultSubject
  React.useEffect(() => {
    if (visible) {
      if (defaultSubject && !subject) {
        setSubject(defaultSubject);
      }
    }
  }, [visible, defaultSubject]);

  const handlePickDocument = async () => {
    if (isPicking || isUploading) return;
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        });

        // Auto-fill title if empty
        if (!title.trim()) {
          const cleanName = asset.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }

        setErrors((prev) => ({ ...prev, file: undefined }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('File Selection Failed', 'Could not open document picker. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setSubject(defaultSubject);
    setCategory('notes');
    setDescription('');
    setErrors({});
    setIsUploading(false);
    setIsPicking(false);
  };

  const handleClose = () => {
    if (isUploading || isPicking) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const newErrors: { title?: string; file?: string } = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsUploading(true);
      const { teacherService } = await import('@/services/teacher.service');

      await teacherService.createMaterial(
        {
          batchId,
          title: title.trim(),
          description: description.trim() || undefined,
          subject: (subject || defaultSubject || 'General').trim(),
          category,
        },
        selectedFile!,
      );

      resetForm();
      onUploadSuccess();
      onClose();
    } catch (e: any) {
      console.error('Failed to upload study material:', e);
      Alert.alert('Upload Failed', e?.message || 'Could not save study material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const fileType = selectedFile ? detectFileType(selectedFile.name, selectedFile.mimeType) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable
          style={styles.modalBackdropTouch}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close upload material modal"
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerIconRow}>
              <View style={styles.headerIcon}>
                <Feather name="upload-cloud" size={20} color={theme.colors.primary.main} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.modalTitle}>
                  Upload Study Material
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  Share notes, sheets, and resources with this batch
                </Text>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* File Picker Section */}
            <View style={styles.fieldBlock}>
              <Text variant="caption" style={styles.fieldLabel}>
                ATTACH DOCUMENT / FILE *
              </Text>
              {selectedFile ? (
                <View style={styles.fileSelectedCard}>
                  <View style={styles.fileIconWrapper}>
                    <Feather
                      name={fileType === 'pdf' ? 'file-text' : fileType === 'image' ? 'image' : 'file'}
                      size={24}
                      color={fileType === 'pdf' ? theme.colors.semantic.danger.main : theme.colors.primary.main}
                    />
                  </View>
                  <View style={styles.fileDetails}>
                    <Text variant="body" numberOfLines={1} style={styles.selectedFileName}>
                      {selectedFile.name}
                    </Text>
                    <View style={styles.fileMetaRow}>
                      <Badge
                        label={fileType?.toUpperCase() || 'FILE'}
                        variant={fileType === 'pdf' ? 'danger' : 'primary'}
                        size="sm"
                      />
                      {selectedFile.size && (
                        <Text variant="caption" style={styles.fileSizeText}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={handlePickDocument}
                    disabled={isUploading || isPicking}
                  >
                    <Feather name="edit-2" size={16} color={theme.colors.primary.main} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.pickerDropzone, errors.file ? styles.dropzoneError : null]}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                  disabled={isUploading || isPicking}
                >
                  <View style={styles.dropzoneIconBox}>
                    {isPicking ? (
                      <ActivityIndicator size="small" color={theme.colors.primary.main} />
                    ) : (
                      <Feather name="file-plus" size={26} color={theme.colors.primary.main} />
                    )}
                  </View>
                  <Text variant="body" style={styles.dropzoneTitle}>
                    {isPicking ? 'Opening Document Picker...' : 'Tap to Choose Document'}
                  </Text>
                  <Text variant="caption" style={styles.dropzoneHint}>
                    Supports PDF, DOCX, PPTX, or Images
                  </Text>
                </TouchableOpacity>
              )}
              {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
            </View>

            {/* Title */}
            <Input
              label="Title / Topic Name *"
              placeholder="e.g. Chapter 4 - Optics Revision Notes"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={errors.title}
              editable={!isUploading}
            />

            {/* Subject */}
            <Input
              label="Subject"
              placeholder="e.g. Science / Physics"
              value={subject}
              onChangeText={setSubject}
              editable={!isUploading}
            />

            {/* Category Selector */}
            <View style={styles.fieldBlock}>
              <Text variant="caption" style={styles.fieldLabel}>
                CATEGORY
              </Text>
              <View style={styles.categoryPills}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => setCategory(cat.key)}
                      disabled={isUploading}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name={cat.icon}
                        size={13}
                        color={isSelected ? theme.colors.primary.main : theme.colors.text.secondary}
                      />
                      <Text
                        variant="caption"
                        style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Optional Description */}
            <Input
              label="Description / Special Instructions (Optional)"
              placeholder="e.g. Bring this printed for next Monday's lab activity..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isUploading}
            />
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              style={styles.actionBtn}
              onPress={handleClose}
              disabled={isUploading}
            />
            <Button
              title={isUploading ? 'Uploading...' : 'Save & Publish'}
              variant="primary"
              icon="check"
              style={styles.actionBtn}
              onPress={handleSubmit}
              disabled={isUploading}
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
    maxHeight: '90%',
    gap: 16,
  },
  modalHeader: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
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
    gap: 14,
    paddingVertical: 4,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  pickerDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.focus,
    backgroundColor: theme.colors.primary.bg,
    borderRadius: theme.radii.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dropzoneError: {
    borderColor: theme.colors.semantic.danger.main,
    backgroundColor: theme.colors.semantic.danger.bg,
  },
  dropzoneIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  dropzoneHint: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  fileSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.lg,
    padding: 12,
    gap: 12,
  },
  fileIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  fileDetails: {
    flex: 1,
    gap: 4,
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSizeText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  changeFileButton: {
    padding: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary.bg,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: theme.colors.background.paper,
  },
  categoryPillActive: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  categoryPillTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.semantic.danger.main,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  actionBtn: {
    flex: 1,
  },
});
