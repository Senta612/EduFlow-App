import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BatchCard } from '@/components/ui/BatchCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { teacherService, isBatchScheduledToday } from '@/services/teacher.service';
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

type FilterType = 'all' | 'today';

export default function TeacherBatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadBatches = useCallback(async () => {
    setHasError(false);
    try {
      const data = await teacherService.getBatches();
      setBatches(data);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();

    // Subscribe to real-time batch creations/updates
    const unsubscribe = teacherService.subscribeBatches((updatedBatches) => {
      setBatches(updatedBatches);
    });

    return () => {
      unsubscribe();
    };
  }, [loadBatches]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadBatches();
  };

  // Filtered & Searched Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // 1. Filter Tab Check
      if (activeFilter === 'today' && !isBatchScheduledToday(batch.schedule)) {
        return false;
      }

      // 2. Search Query Check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = batch.name.toLowerCase().includes(q);
      const subjectMatch = batch.subject.toLowerCase().includes(q);
      const gradeMatch = batch.grade.toLowerCase().includes(q);

      return nameMatch || subjectMatch || gradeMatch;
    });
  }, [batches, activeFilter, searchQuery]);

  const todayCount = useMemo(() => {
    return batches.filter((b) => isBatchScheduledToday(b.schedule)).length;
  }, [batches]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="heading" style={styles.headerTitle}>
            Batches
          </Text>
          <Text variant="caption" style={styles.headerSubtitle}>
            Your teaching groups & rosters
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(teacher)/more/notifications')}
          hitSlop={8}
          style={styles.notifButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Feather name="bell" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {/* Search Bar & Filter Pills Section */}
      <View style={styles.controlsSection}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color={theme.colors.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batches by name, subject, or grade..."
            placeholderTextColor={theme.colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search batches"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearSearchBtn}
            >
              <Feather
                name="x"
                size={16}
                color={theme.colors.text.secondary}
              />
            </Pressable>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterPill,
              activeFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('all')}
            accessibilityRole="button"
            accessibilityLabel="Show all batches"
          >
            <Text
              variant="caption"
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Batches ({batches.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              activeFilter === 'today' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('today')}
            accessibilityRole="button"
            accessibilityLabel="Show today's batches"
          >
            <Text
              variant="caption"
              style={[
                styles.filterPillText,
                activeFilter === 'today' && styles.filterPillTextActive,
              ]}
            >
              Today ({todayCount})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Batches FlatList */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text variant="body" style={styles.loadingText}>
            Loading teaching groups...
          </Text>
        </View>
      ) : hasError ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="alert-triangle"
            title="Couldn't load your batches"
            description="Something went wrong while loading your teaching groups."
            actionLabel="Try Again"
            onAction={loadBatches}
          />
        </View>
      ) : (
        <FlatList
          data={filteredBatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BatchCard
              batch={item}
              onPress={() => router.push(`/(teacher)/batch/${item.id}`)}
              style={styles.batchCardSpacing}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 }, // Extra space for FAB and bottom tabs
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.main]}
              tintColor={theme.colors.primary.main}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={searchQuery ? 'search' : 'layers'}
              title={
                searchQuery
                  ? `No batches matching "${searchQuery}"`
                  : activeFilter === 'today'
                  ? 'No batches scheduled today'
                  : 'No batches yet'
              }
              description={
                searchQuery
                  ? 'Try searching with a different subject or grade name.'
                  : activeFilter === 'today'
                  ? 'None of your batches have a class scheduled for today.'
                  : 'Your assigned teaching groups will appear here. Tap the + button to create one.'
              }
              actionLabel={searchQuery ? 'Clear Search' : '+ Create Batch'}
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : () => router.push('/(teacher)/batch/create')
              }
            />
          }
        />
      )}

      {/* Floating Add Button (FAB) in Bottom Right */}
      <Pressable
        style={[
          styles.fab,
          { bottom: insets.bottom + 16 },
        ]}
        onPress={() => router.push('/(teacher)/batch/create')}
        accessibilityRole="button"
        accessibilityLabel="Create Batch"
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsSection: {
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    gap: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    paddingHorizontal: theme.spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
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
  listContent: {
    padding: theme.spacing.lg,
  },
  batchCardSpacing: {
    marginBottom: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
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
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
