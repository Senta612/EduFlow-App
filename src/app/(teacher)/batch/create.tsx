import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { theme } from '@/theme';

const GRADE_OPTIONS = [
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Other',
];

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'M', name: 'Mon' },
  { id: 'Tue', label: 'T', name: 'Tue' },
  { id: 'Wed', label: 'W', name: 'Wed' },
  { id: 'Thu', label: 'T', name: 'Thu' },
  { id: 'Fri', label: 'F', name: 'Fri' },
  { id: 'Sat', label: 'S', name: 'Sat' },
  { id: 'Sun', label: 'S', name: 'Sun' },
];

const TIME_PRESETS = [
  '08:00 AM - 09:30 AM',
  '10:00 AM - 11:30 AM',
  '12:30 PM - 02:00 PM',
  '03:00 PM - 04:30 PM',
  '05:00 PM - 06:30 PM',
];

const createBatchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Batch name must be at least 3 characters')
    .max(60, 'Batch name cannot exceed 60 characters'),
  subject: z
    .string()
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(40, 'Subject cannot exceed 40 characters'),
  grade: z.string().min(1, 'Please select a grade/level'),
  timing: z
    .string()
    .trim()
    .min(3, 'Please specify class timing')
    .max(50, 'Timing description too long'),
  room: z.string().trim().max(30, 'Room name too long').optional(),
});

type CreateBatchFormData = z.infer<typeof createBatchSchema>;

export default function CreateBatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [daysError, setDaysError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBatchFormData>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      name: '',
      subject: '',
      grade: 'Grade 10',
      timing: '10:00 AM - 11:30 AM',
      room: '',
    },
  });

  const selectedGrade = watch('grade');
  const selectedTiming = watch('timing');

  const toggleDay = (dayId: string) => {
    setDaysError(null);
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((d) => d !== dayId);
      } else {
        // Maintain standard week order
        const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const updated = [...prev, dayId];
        return updated.sort(
          (a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b),
        );
      }
    });
  };

  const onSubmit = async (data: CreateBatchFormData) => {
    if (selectedDays.length === 0) {
      setDaysError('Please select at least one schedule day');
      return;
    }

    try {
      const scheduleString = selectedDays.join(' • ');

      const newBatch = await teacherService.createBatch({
        name: data.name.trim(),
        subject: data.subject.trim(),
        grade: data.grade,
        schedule: scheduleString,
        timing: data.timing.trim(),
        room: data.room?.trim() ? data.room.trim() : undefined,
      });

      Alert.alert(
        'Batch Created!',
        `"${newBatch.subject} - ${newBatch.name}" is now ready. You can now view its workspace.`,
        [
          {
            text: 'Open Workspace',
            onPress: () => {
              router.replace(`/(teacher)/batch/${newBatch.id}`);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to create batch:', error);
      Alert.alert(
        'Creation Failed',
        'Could not create batch. Please check the entered fields and try again.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Create Batch"
          subtitle="Create a new teaching group"
          showBack
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informational Banner */}
          <View style={styles.infoBanner}>
            <Feather
              name="info"
              size={18}
              color={theme.colors.primary.main}
            />
            <Text variant="caption" style={styles.infoBannerText}>
              Students can be viewed and managed from the Batch Detail workspace after creation.
            </Text>
          </View>

          {/* Batch Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Batch Name"
                placeholder="e.g. Morning Alpha or Batch A"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

          {/* Subject */}
          <Controller
            control={control}
            name="subject"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Subject"
                placeholder="e.g. Mathematics, Physics, Chemistry"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.subject?.message}
              />
            )}
          />

          {/* Grade / Level Selector */}
          <View style={styles.formGroup}>
            <Text variant="label" style={styles.fieldLabel}>
              Grade / Level
            </Text>
            <View style={styles.pillsGrid}>
              {GRADE_OPTIONS.map((grade) => {
                const isSelected = selectedGrade === grade;
                return (
                  <Pressable
                    key={grade}
                    style={[
                      styles.pill,
                      isSelected && styles.pillSelected,
                    ]}
                    onPress={() => setValue('grade', grade)}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {grade}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.grade?.message && (
              <Text variant="caption" style={styles.errorText}>
                {errors.grade.message}
              </Text>
            )}
          </View>

          {/* Schedule Days Multi-Selector */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text variant="label" style={styles.fieldLabel}>
                Schedule Days
              </Text>
              <Text variant="caption" style={styles.labelHint}>
                {selectedDays.length > 0 ? selectedDays.join(' • ') : 'Select days'}
              </Text>
            </View>

            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <Pressable
                    key={day.id}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(day.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${day.name}`}
                  >
                    <Text
                      variant="label"
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {daysError && (
              <Text variant="caption" style={styles.errorText}>
                {daysError}
              </Text>
            )}
          </View>

          {/* Class Time Presets & Input */}
          <View style={styles.formGroup}>
            <Text variant="label" style={styles.fieldLabel}>
              Class Timing
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timingPresetsRow}
            >
              {TIME_PRESETS.map((preset) => {
                const isSelected = selectedTiming === preset;
                return (
                  <Pressable
                    key={preset}
                    style={[
                      styles.timingPresetPill,
                      isSelected && styles.timingPresetPillSelected,
                    ]}
                    onPress={() => setValue('timing', preset)}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.timingPresetText,
                        isSelected && styles.timingPresetTextSelected,
                      ]}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Controller
              control={control}
              name="timing"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Custom time (e.g. 10:00 AM - 11:30 AM)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.timing?.message}
                />
              )}
            />
          </View>

          {/* Room / Location (Optional) */}
          <Controller
            control={control}
            name="room"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Room / Hall / Lab (Optional)"
                placeholder="e.g. Room 204 or Lab 2"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.room?.message}
              />
            )}
          />

          {/* Create Button with duplicate submission lock */}
          <View style={styles.buttonContainer}>
            <Button
              title="Create Batch"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: {
    flex: 1,
    color: theme.colors.primary.dark,
    lineHeight: 18,
  },
  formGroup: {
    gap: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  labelHint: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  pillSelected: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  pillText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  pillTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  dayText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
  },
  timingPresetsRow: {
    gap: theme.spacing.xs,
    paddingBottom: 4,
  },
  timingPresetPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  timingPresetPillSelected: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  timingPresetText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  timingPresetTextSelected: {
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
