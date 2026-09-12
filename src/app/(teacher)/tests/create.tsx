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
import { teacherService } from '@/services/teacher.service';
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

const testSchema = z.object({
  batchId: z.string().min(1, 'Please select a batch'),
  title: z
    .string()
    .min(3, 'Test name must be at least 3 characters')
    .max(100, 'Test name cannot exceed 100 characters'),
  date: z.string().min(1, 'Please enter test date'),
  maxMarks: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Maximum marks must be a positive number',
    }),
});

type TestFormData = z.infer<typeof testSchema>;

export default function CreateTestScreen() {
  const { batchId: initialBatchId } = useLocalSearchParams<{ batchId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [batches, setBatches] = useState<Batch[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      batchId: initialBatchId ?? '',
      title: '',
      date: '15 Sep 2026',
      maxMarks: '50',
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

  const onSubmit = async (data: TestFormData) => {
    try {
      const targetBatch = batches.find((b) => b.id === data.batchId);
      const createdTest = await teacherService.createTest({
        batchId: data.batchId,
        batchName: targetBatch ? `${targetBatch.subject} (${targetBatch.grade})` : 'General',
        title: data.title,
        date: data.date,
        maxMarks: Number(data.maxMarks),
        totalStudents: targetBatch?.studentCount ?? 30,
      });

      Alert.alert(
        'Assessment Created!',
        `"${data.title}" is ready. Would you like to enter marks now?`,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(teacher)/(tabs)');
              }
            },
          },
          {
            text: 'Enter Marks Now',
            onPress: () => {
              router.replace(`/(teacher)/tests/${createdTest.id}/marks`);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to create test:', error);
      Alert.alert('Error', 'Could not create assessment. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Create Assessment"
        subtitle="Schedule a test & set maximum marks"
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

          {/* Test Name */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Test Name / Title"
                placeholder="e.g. Unit Test 3: Calculus & Limits"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          {/* Test Date */}
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Test Date"
                placeholder="e.g. 15 Sep 2026"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={scrollToBottom}
                error={errors.date?.message}
              />
            )}
          />

          {/* Max Marks */}
          <Controller
            control={control}
            name="maxMarks"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Maximum Marks"
                placeholder="e.g. 50 or 100"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={scrollToBottom}
                keyboardType="numeric"
                error={errors.maxMarks?.message}
              />
            )}
          />

          {/* Submit */}
          <View style={styles.buttonContainer}>
            <Button
              title="Save Assessment"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
});
