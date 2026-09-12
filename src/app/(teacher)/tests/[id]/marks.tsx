import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { Test, StudentMark } from '@/types/teacher';
import { theme } from '@/theme';

export default function EnterTestMarksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [test, setTest] = useState<Test | null>(null);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTestData = useCallback(async () => {
    if (!id) return;
    try {
      const testData = await teacherService.getTestById(id);
      if (testData) {
        setTest(testData);
        const marksData = await teacherService.getTestMarks(id, testData.batchId);
        setMarks(marksData);
      }
    } catch (error) {
      console.error('Failed to load test marks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  const handleMarkChange = (studentId: string, text: string) => {
    const trimmed = text.trim();

    // Clear error
    setInputErrors((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

    if (trimmed === '') {
      setMarks((prev) =>
        prev.map((m) =>
          m.studentId === studentId ? { ...m, marksObtained: null } : m,
        ),
      );
      return;
    }

    const num = Number(trimmed);
    if (isNaN(num)) {
      setInputErrors((prev) => ({
        ...prev,
        [studentId]: 'Must be a number',
      }));
      return;
    }

    if (num < 0) {
      setInputErrors((prev) => ({
        ...prev,
        [studentId]: 'Cannot be negative',
      }));
      return;
    }

    if (test && num > test.maxMarks) {
      setInputErrors((prev) => ({
        ...prev,
        [studentId]: `Max is ${test.maxMarks}`,
      }));
      return;
    }

    setMarks((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, marksObtained: num } : m,
      ),
    );
  };

  const handleSaveMarks = async () => {
    if (!id || !test) return;

    // Check if there are any pending errors
    if (Object.keys(inputErrors).length > 0) {
      Alert.alert(
        'Invalid Marks',
        'Please correct the highlighted errors before saving.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await teacherService.saveTestMarks(id, marks);
      const filledCount = marks.filter((m) => m.marksObtained !== null).length;

      Alert.alert(
        'Marks Saved!',
        `Successfully recorded marks for ${filledCount} of ${marks.length} students.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(teacher)/(tabs)');
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to save test marks:', error);
      Alert.alert('Error', 'Could not save marks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const enteredCount = marks.filter((m) => m.marksObtained !== null).length;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text variant="body" style={styles.loadingText}>
          Loading marks entry sheet...
        </Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Enter Marks" showBack />
        <EmptyState
          icon="alert-circle"
          title="Assessment not found"
          description="The requested test could not be located."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Enter Marks"
          subtitle={`${test.title} • Max: ${test.maxMarks}`}
          showBack
        />

        {/* Assessment Meta Banner */}
        <View style={styles.banner}>
          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              <Text variant="label" style={styles.batchTitle}>
                {test.batchName}
              </Text>
              <Text variant="caption" style={styles.dateSubtitle}>
                Conducted: {test.date}
              </Text>
            </View>
            <View style={styles.badgeGroup}>
              <Badge
                label={`Max Marks: ${test.maxMarks}`}
                variant="primary"
                size="sm"
              />
              <Badge
                label={`${enteredCount}/${marks.length} Entered`}
                variant={
                  enteredCount === marks.length ? 'success' : 'warning'
                }
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Marks Entry List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="outlined" padding="none" style={styles.tableCard}>
            {marks.map((item, index) => {
              const isLast = index === marks.length - 1;
              const hasError = Boolean(inputErrors[item.studentId]);
              const isFilled = item.marksObtained !== null;

              return (
                <View
                  key={item.studentId}
                  style={[
                    styles.markRow,
                    !isLast && styles.markRowBorder,
                    hasError && styles.markRowError,
                  ]}
                >
                  <View style={styles.studentInfoGroup}>
                    <View style={styles.rollBadge}>
                      <Text variant="caption" style={styles.rollText}>
                        {item.rollNumber}
                      </Text>
                    </View>
                    <View style={styles.nameBlock}>
                      <Text variant="label" style={styles.studentName}>
                        {item.studentName}
                      </Text>
                      {hasError ? (
                        <Text variant="caption" style={styles.errorCaption}>
                          {inputErrors[item.studentId]}
                        </Text>
                      ) : (
                        <Text variant="caption" style={styles.subtext}>
                          {isFilled
                            ? `${item.marksObtained} / ${test.maxMarks} marks`
                            : 'Marks not entered'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Marks Input Box */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.marksInput,
                        hasError && styles.marksInputError,
                        isFilled && !hasError && styles.marksInputFilled,
                      ]}
                      placeholder="-"
                      placeholderTextColor={theme.colors.text.disabled}
                      keyboardType="numeric"
                      defaultValue={
                        item.marksObtained !== null
                          ? String(item.marksObtained)
                          : ''
                      }
                      onChangeText={(text) =>
                        handleMarkChange(item.studentId, text)
                      }
                      maxLength={4}
                      accessibilityLabel={`Marks for ${item.studentName}`}
                    />
                    <Text variant="caption" style={styles.maxMarksSuffix}>
                      / {test.maxMarks}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </ScrollView>

        {/* Floating Save Button Bar */}
        <View
          style={[
            styles.submitBar,
            {
              paddingBottom:
                insets.bottom > 0 ? insets.bottom : theme.spacing.md,
            },
          ]}
        >
          <View style={styles.submitMeta}>
            <Text variant="label" style={styles.submitSummaryText}>
              {enteredCount} of {marks.length} Graded
            </Text>
            <Text variant="caption" style={styles.submitSubtitle}>
              {marks.length - enteredCount === 0
                ? 'All student marks entered'
                : `${marks.length - enteredCount} students remaining`}
            </Text>
          </View>
          <Button
            title="Save Marks"
            variant="primary"
            loading={isSaving}
            onPress={handleSaveMarks}
            style={styles.submitButton}
          />
        </View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  banner: {
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaGroup: {
    gap: 2,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  batchTitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
  },
  dateSubtitle: {
    color: theme.colors.text.secondary,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  tableCard: {
    overflow: 'hidden',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
  },
  markRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  markRowError: {
    backgroundColor: '#FFF8F8',
  },
  studentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rollBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollText: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: theme.colors.text.primary,
  },
  subtext: {
    color: theme.colors.text.secondary,
  },
  errorCaption: {
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marksInput: {
    width: 60,
    height: 40,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    backgroundColor: theme.colors.background.paper,
    textAlign: 'center',
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  marksInputFilled: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  marksInputError: {
    borderColor: theme.colors.semantic.danger.main,
    backgroundColor: theme.colors.semantic.danger.bg,
  },
  maxMarksSuffix: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  submitMeta: {
    flex: 1,
    gap: 2,
  },
  submitSummaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  submitSubtitle: {
    color: theme.colors.text.secondary,
  },
  submitButton: {
    minWidth: 150,
  },
});
