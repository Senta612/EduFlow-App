import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
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
import {
  Homework,
  StudentHomeworkItem,
  HomeworkStatus,
} from '@/types/teacher';
import { theme } from '@/theme';

type FilterTab = 'all' | 'done' | 'half_done' | 'not_done';

export default function HomeworkSubmissionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [homework, setHomework] = useState<Homework | null>(null);
  const [items, setItems] = useState<StudentHomeworkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const hwData = await teacherService.getHomeworkById(id);
      if (hwData) {
        setHomework(hwData);
        const submissions = await teacherService.getHomeworkSubmissions(id, hwData.batchId);
        setItems(submissions);
      }
    } catch (error) {
      console.error('Failed to load homework submissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status counters
  const doneCount = useMemo(
    () => items.filter((i) => i.status === 'done').length,
    [items]
  );
  const halfDoneCount = useMemo(
    () => items.filter((i) => i.status === 'half_done').length,
    [items]
  );
  const notDoneCount = useMemo(
    () => items.filter((i) => i.status === 'not_done').length,
    [items]
  );
  const totalCount = items.length;

  const donePercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const halfDonePercent = totalCount > 0 ? Math.round((halfDoneCount / totalCount) * 100) : 0;

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by tab
      if (activeFilter !== 'all' && item.status !== activeFilter) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesRoll = item.rollNumber.toLowerCase().includes(q);
        return matchesName || matchesRoll;
      }
      return true;
    });
  }, [items, activeFilter, searchQuery]);

  const handleStatusChange = (studentId: string, status: HomeworkStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status } : item
      )
    );
  };

  const handleMarkAll = (status: HomeworkStatus) => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, status }))
    );
  };

  const handleSave = async () => {
    if (!id || !homework) return;
    setIsSaving(true);
    try {
      await teacherService.saveHomeworkSubmissions(id, homework.batchId, items);

      Alert.alert(
        'Homework Status Saved!',
        `Updated status for ${items.length} students:\n• ${doneCount} Completed\n• ${halfDoneCount} Partially Done\n• ${notDoneCount} Pending`,
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
        ]
      );
    } catch (error) {
      console.error('Failed to save homework submissions:', error);
      Alert.alert('Error', 'Could not save submissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text variant="body" style={styles.loadingText}>
          Loading student submissions...
        </Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Homework Submissions" showBack />
        <EmptyState
          icon="alert-circle"
          title="Homework not found"
          description="The requested homework assignment could not be loaded."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Check Homework"
        subtitle={`${homework.batchName} • Due: ${homework.dueDate}`}
        showBack
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* Homework Summary Card */}
          <Card variant="elevated" padding="md" style={styles.hwOverviewCard}>
            <View style={styles.hwTopRow}>
              <View style={styles.hwIconBox}>
                <Feather name="book-open" size={18} color={theme.colors.primary.main} />
              </View>
              <View style={styles.hwHeaderCol}>
                <Text variant="heading" style={styles.hwTitle}>
                  {homework.title}
                </Text>
                <View style={styles.hwMetaRow}>
                  <Badge label={`Due: ${homework.dueDate}`} variant="warning" size="sm" icon="clock" />
                  <Badge label={`${totalCount} Students`} variant="neutral" size="sm" />
                </View>
              </View>
            </View>

            {homework.description ? (
              <Text variant="body" numberOfLines={3} style={styles.hwDesc}>
                {homework.description}
              </Text>
            ) : null}

            {/* Visual Multi-Colored Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressHeaderRow}>
                <Text variant="caption" style={styles.progressCaption}>
                  Completion Progress
                </Text>
                <Text variant="caption" style={styles.progressPercent}>
                  {donePercent}% Done • {halfDonePercent}% Half Done
                </Text>
              </View>
              <View style={styles.multiBarBg}>
                <View
                  style={[
                    styles.multiBarSegment,
                    {
                      width: `${donePercent}%`,
                      backgroundColor: theme.colors.semantic.success.main,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.multiBarSegment,
                    {
                      width: `${halfDonePercent}%`,
                      backgroundColor: theme.colors.semantic.warning.main,
                    },
                  ]}
                />
              </View>
            </View>
          </Card>

          {/* Quick Metrics Grid */}
          <View style={styles.kpiGrid}>
            <Pressable
              style={[
                styles.kpiCard,
                styles.kpiDone,
                activeFilter === 'done' && styles.kpiCardSelectedDone,
              ]}
              onPress={() => setActiveFilter(activeFilter === 'done' ? 'all' : 'done')}
            >
              <View style={styles.kpiIconBoxDone}>
                <Feather name="check-circle" size={16} color={theme.colors.semantic.success.main} />
              </View>
              <View>
                <Text variant="caption" style={styles.kpiLabel}>
                  Done
                </Text>
                <Text variant="title" style={styles.kpiValueDone}>
                  {doneCount}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.kpiCard,
                styles.kpiHalf,
                activeFilter === 'half_done' && styles.kpiCardSelectedHalf,
              ]}
              onPress={() => setActiveFilter(activeFilter === 'half_done' ? 'all' : 'half_done')}
            >
              <View style={styles.kpiIconBoxHalf}>
                <Feather name="pie-chart" size={16} color={theme.colors.semantic.warning.main} />
              </View>
              <View>
                <Text variant="caption" style={styles.kpiLabel}>
                  Half Done
                </Text>
                <Text variant="title" style={styles.kpiValueHalf}>
                  {halfDoneCount}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.kpiCard,
                styles.kpiNotDone,
                activeFilter === 'not_done' && styles.kpiCardSelectedNotDone,
              ]}
              onPress={() => setActiveFilter(activeFilter === 'not_done' ? 'all' : 'not_done')}
            >
              <View style={styles.kpiIconBoxNotDone}>
                <Feather name="x-circle" size={16} color={theme.colors.semantic.danger.main} />
              </View>
              <View>
                <Text variant="caption" style={styles.kpiLabel}>
                  Not Done
                </Text>
                <Text variant="title" style={styles.kpiValueNotDone}>
                  {notDoneCount}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Quick Actions & Search Bar */}
          <View style={styles.actionsBar}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={15} color={theme.colors.text.disabled} style={styles.searchIcon} />
              <TextInput
                placeholder="Search student or roll number..."
                placeholderTextColor={theme.colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={14} color={theme.colors.text.secondary} />
                </Pressable>
              )}
            </View>

            <View style={styles.bulkButtonsRow}>
              <Pressable style={styles.bulkBtnDone} onPress={() => handleMarkAll('done')}>
                <Feather name="check" size={13} color={theme.colors.semantic.success.main} />
                <Text variant="caption" style={styles.bulkBtnTextDone}>
                  Mark All Done
                </Text>
              </Pressable>
              <Pressable style={styles.bulkBtnReset} onPress={() => handleMarkAll('not_done')}>
                <Feather name="rotate-ccw" size={13} color={theme.colors.text.secondary} />
                <Text variant="caption" style={styles.bulkBtnTextReset}>
                  Reset All
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterChipsRow}>
            {(
              [
                { key: 'all', label: `All (${totalCount})` },
                { key: 'done', label: `Done (${doneCount})` },
                { key: 'half_done', label: `Half (${halfDoneCount})` },
                { key: 'not_done', label: `Pending (${notDoneCount})` },
              ] as { key: FilterTab; label: string }[]
            ).map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveFilter(tab.key)}
                >
                  <Text
                    variant="caption"
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Students List */}
          {filteredItems.length === 0 ? (
            <EmptyState
              icon="search"
              title="No students match filter"
              description="Try adjusting your search query or filter selection."
              actionLabel="Show All Students"
              onAction={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
            />
          ) : (
            <View style={styles.studentList}>
              {filteredItems.map((item) => {
                const isDone = item.status === 'done';
                const isHalf = item.status === 'half_done';
                const isNotDone = item.status === 'not_done';

                return (
                  <Card
                    key={item.studentId}
                    variant="outlined"
                    padding="none"
                    style={[
                      styles.studentRowCard,
                      isDone && styles.studentRowCardDone,
                      isHalf && styles.studentRowCardHalf,
                      isNotDone && styles.studentRowCardNotDone,
                    ]}
                  >
                    <View style={styles.studentRowMain}>
                      {/* Avatar */}
                      <View
                        style={[
                          styles.studentAvatar,
                          isDone && styles.studentAvatarDone,
                          isHalf && styles.studentAvatarHalf,
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={[
                            styles.studentAvatarText,
                            isDone && styles.studentAvatarTextDone,
                            isHalf && styles.studentAvatarTextHalf,
                          ]}
                        >
                          {getInitials(item.studentName)}
                        </Text>
                      </View>

                      {/* Name & Roll */}
                      <View style={styles.studentInfoCol}>
                        <Text variant="label" style={styles.studentName} numberOfLines={1}>
                          {item.studentName}
                        </Text>
                        <Text variant="caption" style={styles.studentRoll}>
                          Roll #{item.rollNumber}
                        </Text>
                      </View>

                      {/* 3-Segmented Status Switcher */}
                      <View style={styles.segmentedControl}>
                        {/* DONE */}
                        <Pressable
                          style={[
                            styles.segmentBtn,
                            styles.segmentBtnDone,
                            isDone && styles.segmentBtnDoneActive,
                          ]}
                          onPress={() => handleStatusChange(item.studentId, 'done')}
                        >
                          <Feather
                            name="check"
                            size={13}
                            color={isDone ? '#FFFFFF' : theme.colors.semantic.success.main}
                          />
                          <Text
                            variant="caption"
                            style={[
                              styles.segmentText,
                              isDone && styles.segmentTextActiveWhite,
                            ]}
                          >
                            Done
                          </Text>
                        </Pressable>

                        {/* HALF DONE */}
                        <Pressable
                          style={[
                            styles.segmentBtn,
                            styles.segmentBtnHalf,
                            isHalf && styles.segmentBtnHalfActive,
                          ]}
                          onPress={() => handleStatusChange(item.studentId, 'half_done')}
                        >
                          <Feather
                            name="pie-chart"
                            size={12}
                            color={isHalf ? '#FFFFFF' : theme.colors.semantic.warning.main}
                          />
                          <Text
                            variant="caption"
                            style={[
                              styles.segmentText,
                              isHalf && styles.segmentTextActiveWhite,
                            ]}
                          >
                            Half
                          </Text>
                        </Pressable>

                        {/* NOT DONE */}
                        <Pressable
                          style={[
                            styles.segmentBtn,
                            styles.segmentBtnNotDone,
                            isNotDone && styles.segmentBtnNotDoneActive,
                          ]}
                          onPress={() => handleStatusChange(item.studentId, 'not_done')}
                        >
                          <Feather
                            name="x"
                            size={13}
                            color={isNotDone ? '#FFFFFF' : theme.colors.semantic.danger.main}
                          />
                          <Text
                            variant="caption"
                            style={[
                              styles.segmentText,
                              isNotDone && styles.segmentTextActiveWhite,
                            ]}
                          >
                            No
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Floating Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.bottomBarInfo}>
            <Text variant="caption" style={styles.bottomBarCount}>
              {doneCount + halfDoneCount}/{totalCount} completed
            </Text>
            <Text variant="caption" style={styles.bottomBarBreakdown}>
              {doneCount} Done • {halfDoneCount} Half • {notDoneCount} Not Done
            </Text>
          </View>
          <View style={styles.bottomBarBtnWrapper}>
            <Button
              title="Save Status"
              icon="check-circle"
              variant="primary"
              loading={isSaving}
              onPress={handleSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  // Overview Card
  hwOverviewCard: {
    gap: theme.spacing.sm,
  },
  hwTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  hwIconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwHeaderCol: {
    flex: 1,
    gap: 4,
  },
  hwTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base + 1,
    fontWeight: theme.typography.weights.bold,
  },
  hwMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  hwDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs + 1,
    lineHeight: 18,
  },

  // Progress bar
  progressBarWrapper: {
    gap: 6,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCaption: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
  },
  progressPercent: {
    color: theme.colors.primary.main,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
  },
  multiBarBg: {
    height: 8,
    borderRadius: theme.radii.full,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  multiBarSegment: {
    height: '100%',
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
  },
  kpiDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  kpiHalf: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  kpiNotDone: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  kpiCardSelectedDone: {
    borderColor: theme.colors.semantic.success.main,
    borderWidth: 2,
  },
  kpiCardSelectedHalf: {
    borderColor: theme.colors.semantic.warning.main,
    borderWidth: 2,
  },
  kpiCardSelectedNotDone: {
    borderColor: theme.colors.semantic.danger.main,
    borderWidth: 2,
  },
  kpiIconBoxDone: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxHalf: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxNotDone: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
  },
  kpiValueDone: {
    color: theme.colors.semantic.success.main,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  kpiValueHalf: {
    color: theme.colors.semantic.warning.main,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  kpiValueNotDone: {
    color: theme.colors.semantic.danger.main,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },

  // Actions Bar
  actionsBar: {
    gap: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    paddingVertical: 0,
  },
  bulkButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bulkBtnDone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bulkBtnTextDone: {
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 11,
  },
  bulkBtnReset: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  bulkBtnTextReset: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 11,
  },

  // Filter chips
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: theme.colors.primary.main,
  },
  chipText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    fontSize: 11,
  },
  chipTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weights.bold,
  },

  // Student list
  studentList: {
    gap: 8,
  },
  studentRowCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  studentRowCardDone: {
    borderColor: '#BBF7D0',
  },
  studentRowCardHalf: {
    borderColor: '#FED7AA',
  },
  studentRowCardNotDone: {
    borderColor: '#FECACA',
  },
  studentRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm + 2,
    gap: theme.spacing.sm,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarDone: {
    backgroundColor: '#DCFCE7',
  },
  studentAvatarHalf: {
    backgroundColor: '#FEF3C7',
  },
  studentAvatarText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.bold,
    fontSize: 12,
  },
  studentAvatarTextDone: {
    color: theme.colors.semantic.success.main,
  },
  studentAvatarTextHalf: {
    color: theme.colors.semantic.warning.main,
  },
  studentInfoCol: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  studentRoll: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },

  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: theme.radii.sm,
    padding: 2,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.radii.sm - 2,
  },
  segmentBtnDone: {
    backgroundColor: 'transparent',
  },
  segmentBtnHalf: {
    backgroundColor: 'transparent',
  },
  segmentBtnNotDone: {
    backgroundColor: 'transparent',
  },
  segmentBtnDoneActive: {
    backgroundColor: theme.colors.semantic.success.main,
  },
  segmentBtnHalfActive: {
    backgroundColor: theme.colors.semantic.warning.main,
  },
  segmentBtnNotDoneActive: {
    backgroundColor: theme.colors.semantic.danger.main,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
  },
  segmentTextActiveWhite: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
  },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomBarInfo: {
    flex: 1,
    gap: 2,
  },
  bottomBarCount: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.sm,
  },
  bottomBarBreakdown: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  bottomBarBtnWrapper: {
    minWidth: 140,
  },
});
