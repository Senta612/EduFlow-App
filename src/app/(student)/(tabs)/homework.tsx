import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StudentHomeworkCard } from '@/components/student-portal';
import { StudentService } from '@/services/student.service';
import { StudentHomeworkItemView } from '@/types/student';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

type FilterType = 'all' | 'pending' | 'completed';

export default function StudentHomeworkScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState<StudentHomeworkItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await StudentService.getHomeworkList(profile?.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load student homework:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleToggleStatus = async (item: StudentHomeworkItemView) => {
    const newStatus = item.status === 'done' ? 'not_done' : 'done';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((hw) =>
        hw.id === item.id
          ? { ...hw, status: newStatus, submittedAt: newStatus === 'done' ? 'Just now' : undefined }
          : hw
      )
    );

    try {
      await StudentService.updateHomeworkStatus(item.id, newStatus);
    } catch (err) {
      console.error('Failed to update homework status:', err);
      // Revert on error
      loadData();
    }
  };

  const pendingCount = items.filter((i) => i.status !== 'done').length;
  const completedCount = items.filter((i) => i.status === 'done').length;

  const filteredItems = items.filter((i) => {
    if (filter === 'pending') return i.status !== 'done';
    if (filter === 'completed') return i.status === 'done';
    return true;
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Homework & Tasks"
        subtitle="Assignments, due dates & solutions"
      />

      {/* Segmented Filter Control */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            All ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'pending' && styles.filterTextActive,
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && styles.filterTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading homework list...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.main]}
              tintColor={theme.colors.primary.main}
            />
          }
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <StudentHomeworkCard
                key={item.id}
                item={item}
                onToggleStatus={handleToggleStatus}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather
                  name={filter === 'pending' ? 'check-circle' : 'book-open'}
                  size={32}
                  color={theme.colors.state.success}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'pending'
                  ? 'All Caught Up! 🎉'
                  : 'No Homework in this section'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'pending'
                  ? 'Great job! You have submitted all your assignments.'
                  : 'Check back later for newly posted worksheets.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    gap: theme.spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.screen,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.state.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
