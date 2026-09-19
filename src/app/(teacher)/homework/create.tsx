import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { DatePickerInput } from '@/components/ui/DatePicker';
import { teacherService } from '@/services/teacher.service';
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

const homeworkSchema = z.object({
  batchId: z.string().min(1, 'Please select a batch'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
  dueDate: z.string().min(1, 'Please specify a due date'),
});

type HomeworkFormData = z.infer<typeof homeworkSchema>;

export default function CreateHomeworkScreen() {
  const { batchId: initialBatchId } = useLocalSearchParams<{ batchId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ title: string; batchName: string; dueDate: string } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkFormData>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      batchId: initialBatchId ?? '',
      title: '',
      description: '',
      dueDate: 'Tomorrow, 05:00 PM',
    },
  });

  const selectedBatchId = watch('batchId');

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => {
    async function loadBatches() {
      const data = await teacherService.getBatches();
      setBatches(data);
      if (!initialBatchId && data.length > 0) {
        setValue('batchId', data[0].id);
      }
    }
    loadBatches();
  }, [initialBatchId, setValue]);

  const onSubmit = async (data: HomeworkFormData) => {
    try {
      const targetBatch = batches.find((b) => b.id === data.batchId);
      const batchName = targetBatch ? `${targetBatch.name || targetBatch.subject} (${targetBatch.grade})` : 'General';
      await teacherService.createHomework({
        batchId: data.batchId,
        batchName,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        totalStudents: targetBatch?.studentCount ?? 30,
      });

      setCreatedInfo({
        title: data.title,
        batchName,
        dueDate: data.dueDate,
      });
      setIsSuccessModalVisible(true);
    } catch (error) {
      console.error('Failed to create homework:', error);
      Alert.alert(
        'Publication Error',
        'Could not publish homework. Please verify fields and try again.',
      );
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalVisible(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(teacher)/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Create Homework"
        subtitle="Assign practice exercises to students"
        showBack
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 220, 260) },
          ]}
        >
          {/* Batch Selector */}
          <View style={styles.formGroup}>
            <Text variant="label" style={styles.fieldLabel}>
              Target Batch
            </Text>
            <View style={styles.batchSelectorRow}>
              {batches.map((batch) => {
                const isSelected = selectedBatchId === batch.id;
                return (
                  <Pressable
                    key={batch.id}
                    style={[
                      styles.batchPill,
                      isSelected && styles.batchPillSelected,
                    ]}
                    onPress={() => setValue('batchId', batch.id)}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.batchPillText,
                        isSelected && styles.batchPillTextSelected,
                      ]}
                    >
                      {batch.subject} ({batch.grade})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.batchId?.message && (
              <Text variant="caption" style={styles.errorText}>
                {errors.batchId.message}
              </Text>
            )}
          </View>

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Homework Title"
                placeholder="e.g. Chapter 4 Exercise 4.2 Problems 1-15"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Instructions & Details (Optional)"
                placeholder="Optional instructions, exercises, or submission guidelines..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={scrollToBottom}
                multiline
                numberOfLines={4}
                style={styles.textArea}
                error={errors.description?.message}
              />
            )}
          />

          {/* Due Date & Time */}
          <Controller
            control={control}
            name="dueDate"
            render={({ field: { onChange, value } }) => (
              <DatePickerInput
                label="Due Date & Time"
                value={value}
                onChange={onChange}
                mode="datetime"
                placeholder="Select submission deadline"
                error={errors.dueDate?.message}
                modalTitle="Set Due Date & Time"
              />
            )}
          />

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Publish Homework"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Homework Published Success Modal */}
      <SuccessModal
        visible={isSuccessModalVisible}
        onClose={handleSuccessClose}
        title="Homework Published!"
        subtitle="Your homework assignment has been successfully assigned to students."
        badgeVariant="success"
        contextBadge={
          createdInfo
            ? {
                icon: 'book-open',
                label: `${createdInfo.batchName} • Due: ${createdInfo.dueDate}`,
              }
            : undefined
        }
        stats={
          createdInfo
            ? [
                {
                  label: 'Assignment',
                  value: createdInfo.title,
                  variant: 'primary',
                },
              ]
            : undefined
        }
        primaryAction={{
          title: 'Done',
          onPress: handleSuccessClose,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  formGroup: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  batchSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  batchPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  batchPillSelected: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  batchPillText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  batchPillTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  errorText: {
    color: theme.colors.semantic.danger.main,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
});
