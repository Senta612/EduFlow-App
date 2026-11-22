import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { theme } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = theme.radii.md,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

export function SkeletonText({
  lines = 1,
  width = '100%',
  height = 14,
  gap = 8,
  style,
}: {
  lines?: number;
  width?: DimensionValue;
  height?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 && lines > 1 ? '70%' : width}
          height={height}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

/**
 * Composite Layout Skeletons matching exact app screens
 */

// 1. Dashboard Layout Skeleton (for Home Screen)
export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardContainer}>
      {/* Top Banner Skeleton */}
      <View style={styles.bannerSkeleton}>
        <SkeletonCircle size={32} />
        <View style={styles.bannerText}>
          <SkeletonBox width="50%" height={16} />
          <SkeletonBox width="80%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Week Calendar Skeleton Card */}
      <View style={styles.calendarSkeletonCard}>
        <View style={styles.calendarHeaderRow}>
          <SkeletonBox width={120} height={20} />
          <SkeletonBox width={70} height={20} borderRadius={theme.radii.full} />
        </View>
        <View style={styles.calendarPillsRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.calendarDayPill}>
              <SkeletonBox width={24} height={10} borderRadius={3} />
              <SkeletonBox width={20} height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
        <View style={styles.calendarFooterRow}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width={64} height={20} borderRadius={theme.radii.full} />
        </View>
      </View>

      {/* Today's Schedule Section Skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderRow}>
          <SkeletonBox width={150} height={20} />
          <SkeletonBox width={80} height={16} />
        </View>

        {/* Schedule Class Card Skeleton */}
        <View style={styles.classCardSkeleton}>
          <View style={styles.classCardHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="70%" height={18} />
              <SkeletonBox width="45%" height={14} />
            </View>
            <SkeletonBox width={90} height={22} borderRadius={theme.radii.full} />
          </View>
          <View style={styles.classCardMeta}>
            <SkeletonBox width={80} height={14} />
            <SkeletonBox width={90} height={14} />
            <SkeletonBox width={60} height={14} />
          </View>
          <View style={styles.classCardActions}>
            <SkeletonBox width="48%" height={40} borderRadius={theme.radii.md} />
            <SkeletonBox width="48%" height={40} borderRadius={theme.radii.md} />
          </View>
        </View>
      </View>

      {/* Quick Actions Grid Skeleton */}
      <View style={styles.sectionSkeleton}>
        <SkeletonBox width={120} height={18} style={{ marginBottom: 4 }} />
        <View style={styles.quickActionsGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.quickActionSkeletonCard}>
              <SkeletonCircle size={36} />
              <SkeletonBox width="70%" height={12} style={{ marginTop: 10 }} />
              <SkeletonBox width="50%" height={10} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 2. Batch List Layout Skeleton
export function BatchListSkeleton() {
  return (
    <View style={styles.listSkeletonContainer}>
      {/* Search and Filter Chips */}
      <View style={styles.searchSkeleton}>
        <SkeletonBox width="100%" height={46} borderRadius={theme.radii.lg} />
      </View>
      <View style={styles.chipRowSkeleton}>
        <SkeletonBox width={70} height={32} borderRadius={theme.radii.full} />
        <SkeletonBox width={85} height={32} borderRadius={theme.radii.full} />
        <SkeletonBox width={95} height={32} borderRadius={theme.radii.full} />
      </View>

      {/* Batch Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.batchCardSkeleton}>
          <View style={styles.batchCardTop}>
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="60%" height={18} />
              <SkeletonBox width="40%" height={13} />
            </View>
            <SkeletonBox width={75} height={22} borderRadius={theme.radii.full} />
          </View>
          <View style={styles.batchCardSchedule}>
            <SkeletonBox width={110} height={14} />
            <SkeletonBox width={90} height={14} />
          </View>
          <View style={styles.batchCardFooter}>
            <SkeletonBox width={100} height={20} borderRadius={theme.radii.full} />
            <SkeletonBox width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

// 3. Generic Tasks & Homework Skeleton
export function TasksListSkeleton() {
  return (
    <View style={styles.listSkeletonContainer}>
      <View style={styles.tabRowSkeleton}>
        <SkeletonBox width="48%" height={38} borderRadius={theme.radii.md} />
        <SkeletonBox width="48%" height={38} borderRadius={theme.radii.md} />
      </View>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.taskCardSkeleton}>
          <View style={styles.taskCardHeader}>
            <SkeletonBox width="65%" height={18} />
            <SkeletonBox width={70} height={20} borderRadius={theme.radii.full} />
          </View>
          <SkeletonBox width="85%" height={13} style={{ marginTop: 8 }} />
          <View style={styles.taskCardFooter}>
            <SkeletonBox width={120} height={14} />
            <SkeletonBox width={90} height={32} borderRadius={theme.radii.md} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E2E8F0',
  },
  dashboardContainer: {
    gap: theme.spacing.lg,
  },
  bannerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  calendarSkeletonCard: {
    padding: 16,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarDayPill: {
    width: 42,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  calendarFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionSkeleton: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classCardSkeleton: {
    padding: 16,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  classCardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  classCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionSkeletonCard: {
    flex: 1,
    padding: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  listSkeletonContainer: {
    padding: theme.spacing.lg,
    gap: 14,
  },
  searchSkeleton: {
    marginBottom: 4,
  },
  chipRowSkeleton: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  batchCardSkeleton: {
    padding: 16,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  batchCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  batchCardSchedule: {
    flexDirection: 'row',
    gap: 16,
  },
  batchCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  tabRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskCardSkeleton: {
    padding: 16,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
});
