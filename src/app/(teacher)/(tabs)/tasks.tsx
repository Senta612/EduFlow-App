import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TaskTypeModal, SelectBatchModal } from '@/components/tasks';
import { teacherService } from '@/services/teacher.service';
import { TeacherTask, TaskType, Batch } from '@/types/teacher';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

type FilterCategory = 'all' | TaskType;

function getTaskIcon(type: TaskType): keyof typeof Feather.glyphMap {
  switch (type) {
    case 'attendance':
      return 'check-square';
    case 'homework':
      return 'book-open';
    case 'marks':
      return 'award';
  }
}

export default function TeacherTasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state for creating / starting tasks
  const [isTaskTypeModalVisible, setIsTaskTypeModalVisible] = useState(false);
  const [isSelectBatchModalVisible, setIsSelectBatchModalVisible] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);

  const filterTabs: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: t('tasks.allTasks') },
    { key: 'attendance', label: t('common.attendance') },
    { key: 'homework', label: t('common.homework') },
    { key: 'marks', label: t('common.marks') },
  ];

  const getTaskBadge = (status: string): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'pending':
        return { label: t('common.pending'), variant: 'warning' };
      case 'in_progress':
        return { label: t('tasks.inProgress'), variant: 'info' };
      case 'completed':
        return { label: t('common.done'), variant: 'success' };
      default:
        return { label: t('common.pending'), variant: 'neutral' };
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [tasksData, batchesData] = await Promise.all([
        teacherService.getPendingTasks(),
        teacherService.getBatches(),
      ]);
      setTasks(tasksData);
      setBatches(batchesData);
    } catch (error) {
      console.error('Failed to load tasks and batches:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'all') return true;
    return task.type === activeFilter;
  });

  const activeTabLabel =
    filterTabs.find((f) => f.key === activeFilter)?.label || t('tasks.allTasks');

  // Handle FAB Press
  const handleFABPress = () => {
    if (activeFilter === 'all') {
      // If user is on "All Tasks", show option to select task type first
      setIsTaskTypeModalVisible(true);
    } else {
      // If user is already on Attendance / Homework / Marks filter, open Select Batch directly
      setSelectedTaskType(activeFilter);
      setIsSelectBatchModalVisible(true);
    }
  };

  // Handle Task Type selected from TaskTypeModal
  const handleSelectTaskType = (type: TaskType) => {
    setSelectedTaskType(type);
    setIsSelectBatchModalVisible(true);
  };

  // Handle Batch selected for a Task
  const handleSelectBatch = (batch: Batch, type: TaskType) => {
    setIsSelectBatchModalVisible(false);
    switch (type) {
      case 'attendance':
        router.push(`/(teacher)/attendance/${batch.id}` as unknown as Href);
        break;
      case 'homework':
        router.push(`/(teacher)/homework/create?batchId=${batch.id}` as unknown as Href);
        break;
      case 'marks':
        router.push(`/(teacher)/tests/create?batchId=${batch.id}` as unknown as Href);
        break;
    }
  };

  // Handle Create New Batch redirect
  const handleCreateNewBatch = () => {
    setIsSelectBatchModalVisible(false);
    router.push('/(teacher)/batch/create' as unknown as Href);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t('tasks.title')}
        subtitle={t('tasks.subtitle')}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 }, // Extra space for FAB and bottom navigation
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="body" style={styles.loadingText}>
              {t('tasks.loadingTasks')}
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title={t('tasks.allCaughtUp')}
            description={
              activeFilter === 'all'
                ? t('tasks.allCaughtUpDesc')
                : t('tasks.noTasksForCategory').replace('{category}', activeTabLabel)
            }
            actionLabel={
              activeFilter === 'all'
                ? '+ Start New Task'
                : activeFilter === 'attendance'
                ? '+ Take Attendance'
                : activeFilter === 'homework'
                ? '+ Assign Homework'
                : '+ Create Test'
            }
            onAction={handleFABPress}
          />
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => {
              const badge = getTaskBadge(task.status);
              const icon = getTaskIcon(task.type);

              return (
                <Card
                  key={task.id}
                  variant="elevated"
                  padding="md"
                  style={styles.taskCard}
                  onPress={() => router.push(task.route as unknown as Href)}
                >
                  <View style={styles.taskHeader}>
                    <View style={styles.taskLeftRow}>
                      <View style={styles.taskIconBox}>
                        <Feather
                          name={icon}
                          size={18}
                          color={theme.colors.primary.main}
                        />
                      </View>
                      <View style={styles.taskTitleGroup}>
                        <Text variant="label" style={styles.taskTitle}>
                          {task.title}
                        </Text>
                        <Text variant="caption" style={styles.taskSubtitle}>
                          {task.subtitle}
                        </Text>
                      </View>
                    </View>
                    <Badge label={badge.label} variant={badge.variant} size="sm" />
                  </View>

                  {task.progressText && (
                    <View style={styles.progressRow}>
                      <Feather
                        name="info"
                        size={13}
                        color={theme.colors.text.secondary}
                      />
                      <Text variant="caption" style={styles.progressText}>
                        {task.progressText}
                      </Text>
                    </View>
                  )}

                  <View style={styles.taskActionRow}>
                    <Button
                      title={
                        task.type === 'attendance'
                          ? t('dashboard.takeAttendance')
                          : task.type === 'homework'
                          ? t('tasks.reviewHomework')
                          : t('tests.enterMarks')
                      }
                      variant="primary"
                      fullWidth
                      onPress={() => router.push(task.route as unknown as Href)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button (FAB) in Bottom Right */}
      <Pressable
        style={[
          styles.fab,
          { bottom: insets.bottom + 16 },
        ]}
        onPress={handleFABPress}
        accessibilityRole="button"
        accessibilityLabel="Create or start task"
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>

      {/* Modal 1: Choose Task Type (When on "All Tasks") */}
      <TaskTypeModal
        visible={isTaskTypeModalVisible}
        onClose={() => setIsTaskTypeModalVisible(false)}
        onSelectType={handleSelectTaskType}
      />

      {/* Modal 2: Select Batch for the Chosen Task */}
      <SelectBatchModal
        visible={isSelectBatchModalVisible}
        onClose={() => setIsSelectBatchModalVisible(false)}
        taskType={selectedTaskType}
        batches={batches}
        onSelectBatch={handleSelectBatch}
        onCreateNewBatch={handleCreateNewBatch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  filterRow: {
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingVertical: theme.spacing.xs,
  },
  filterTabsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  filterPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterPillText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.semibold,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  taskList: {
    gap: theme.spacing.md,
  },
  taskCard: {
    gap: theme.spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  taskIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitleGroup: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  taskSubtitle: {
    color: theme.colors.text.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  progressText: {
    color: theme.colors.text.secondary,
  },
  taskActionRow: {
    marginTop: theme.spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 99,
  },
});
