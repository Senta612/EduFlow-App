import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { TeacherTask, TaskType } from '@/types/teacher';
import { theme } from '@/theme';

type FilterCategory = 'all' | TaskType;

const FILTER_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All Tasks' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'homework', label: 'Homework' },
  { key: 'marks', label: 'Marks' },
];

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

function getTaskBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'pending':
      return { label: 'Pending', variant: 'warning' };
    case 'in_progress':
      return { label: 'In Progress', variant: 'info' };
    case 'completed':
      return { label: 'Completed', variant: 'success' };
    default:
      return { label: 'Pending', variant: 'neutral' };
  }
}

export default function TeacherTasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await teacherService.getPendingTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTasks();
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'all') return true;
    return task.type === activeFilter;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Pending Tasks"
        subtitle="Action items requiring your attention"
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {FILTER_TABS.map((tab) => {
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
          { paddingBottom: insets.bottom + 24 },
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
              Loading actionable tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="You're all caught up!"
            description={
              activeFilter === 'all'
                ? 'No pending attendance, reviews, or marks recording needed right now.'
                : `No pending ${activeFilter} tasks.`
            }
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
                          ? 'Take Attendance'
                          : task.type === 'homework'
                          ? 'Review Homework'
                          : 'Enter Marks'
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
});
