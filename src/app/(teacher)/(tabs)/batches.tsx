import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { teacherService } from '@/services/teacher.service';
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

export default function TeacherBatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const data = await teacherService.getBatches();
      setBatches(data);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadBatches();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="My Batches"
        subtitle="Your assigned teaching groups & rosters"
      />

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
              Loading assigned batches...
            </Text>
          </View>
        ) : batches.length === 0 ? (
          <EmptyState
            icon="layers"
            title="No batches assigned yet"
            description="Your assigned batches will appear here once configured by the institute administrator."
          />
        ) : (
          <View style={styles.batchList}>
            {batches.map((batch) => (
              <Card
                key={batch.id}
                variant="elevated"
                padding="md"
                style={styles.batchCard}
                onPress={() => router.push(`/(teacher)/batch/${batch.id}`)}
              >
                {/* Header row */}
                <View style={styles.batchHeader}>
                  <View style={styles.titleColumn}>
                    <Text variant="heading" style={styles.batchSubject}>
                      {batch.subject}
                    </Text>
                    <Text variant="body" style={styles.batchGrade}>
                      {batch.grade} • {batch.name}
                    </Text>
                  </View>
                  <Badge
                    label={`${batch.studentCount} Students`}
                    variant="primary"
                    icon="users"
                  />
                </View>

                {/* Schedule & timing info */}
                <View style={styles.scheduleBox}>
                  <View style={styles.scheduleItem}>
                    <Feather
                      name="calendar"
                      size={14}
                      color={theme.colors.text.secondary}
                    />
                    <Text variant="caption" style={styles.scheduleText}>
                      {batch.schedule}
                    </Text>
                  </View>
                  <View style={styles.scheduleItem}>
                    <Feather
                      name="clock"
                      size={14}
                      color={theme.colors.text.secondary}
                    />
                    <Text variant="caption" style={styles.scheduleText}>
                      {batch.timing}
                    </Text>
                  </View>
                </View>

                {/* Footer action */}
                <View style={styles.batchFooter}>
                  <Button
                    title="Open Batch Workspace →"
                    variant="secondary"
                    fullWidth
                    onPress={() => router.push(`/(teacher)/batch/${batch.id}`)}
                  />
                </View>
              </Card>
            ))}
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
  batchList: {
    gap: theme.spacing.md,
  },
  batchCard: {
    gap: theme.spacing.md,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.sm,
  },
  batchSubject: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.primary,
  },
  batchGrade: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
  },
  scheduleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  batchFooter: {
    marginTop: 2,
  },
});
