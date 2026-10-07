import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Card } from '@/components/ui/Card';
import { theme } from '@/theme';

export function ReportsSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* 4 Metric Cards Grid Skeleton */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <Animated.View style={[styles.iconBox, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.badgePill, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.valuePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.labelPlaceholder, { opacity: pulseAnim }]} />
          </Card>

          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <Animated.View style={[styles.iconBox, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.badgePill, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.valuePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.labelPlaceholder, { opacity: pulseAnim }]} />
          </Card>
        </View>

        <View style={styles.row}>
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <Animated.View style={[styles.iconBox, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.badgePill, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.valuePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.labelPlaceholder, { opacity: pulseAnim }]} />
          </Card>

          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeader}>
              <Animated.View style={[styles.iconBox, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.badgePill, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.valuePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.labelPlaceholder, { opacity: pulseAnim }]} />
          </Card>
        </View>
      </View>

      {/* Directory Banner Skeleton */}
      <Card variant="outlined" padding="md" style={styles.bannerSkeleton}>
        <View style={styles.bannerLeft}>
          <Animated.View style={[styles.bannerIcon, { opacity: pulseAnim }]} />
          <View style={styles.bannerTextCol}>
            <Animated.View style={[styles.bannerTitle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.bannerSubtitle, { opacity: pulseAnim }]} />
          </View>
        </View>
      </Card>

      {/* Section Skeleton */}
      <View style={styles.sectionHeader}>
        <Animated.View style={[styles.sectionTitle, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.sectionSubtitle, { opacity: pulseAnim }]} />
      </View>

      {/* Defaulter / Report Card Skeleton */}
      <Card variant="elevated" padding="md" style={styles.itemCard}>
        <View style={styles.itemTopRow}>
          <Animated.View style={[styles.avatarBox, { opacity: pulseAnim }]} />
          <View style={{ flex: 1, gap: 6 }}>
            <Animated.View style={[styles.itemTitle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.itemSubtitle, { opacity: pulseAnim }]} />
          </View>
        </View>
        <Animated.View style={[styles.itemChip, { opacity: pulseAnim }]} />
      </Card>

      <Card variant="elevated" padding="md" style={styles.itemCard}>
        <View style={styles.itemTopRow}>
          <Animated.View style={[styles.avatarBox, { opacity: pulseAnim }]} />
          <View style={{ flex: 1, gap: 6 }}>
            <Animated.View style={[styles.itemTitle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.itemSubtitle, { opacity: pulseAnim }]} />
          </View>
        </View>
        <Animated.View style={[styles.itemChip, { opacity: pulseAnim }]} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  grid: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    minHeight: 120,
    backgroundColor: theme.colors.background.paper,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.border.main,
  },
  badgePill: {
    width: 44,
    height: 16,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border.main,
  },
  valuePlaceholder: {
    width: 50,
    height: 24,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.border.main,
    marginVertical: 4,
  },
  labelPlaceholder: {
    width: '80%',
    height: 12,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.light,
  },
  bannerSkeleton: {
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border.main,
  },
  bannerTextCol: {
    flex: 1,
    gap: 6,
  },
  bannerTitle: {
    width: 140,
    height: 14,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.main,
  },
  bannerSubtitle: {
    width: 200,
    height: 10,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.light,
  },
  sectionHeader: {
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    width: 160,
    height: 16,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.main,
  },
  sectionSubtitle: {
    width: 220,
    height: 11,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.light,
  },
  itemCard: {
    backgroundColor: theme.colors.background.paper,
    gap: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.border.main,
  },
  itemTitle: {
    width: 120,
    height: 14,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.main,
  },
  itemSubtitle: {
    width: 90,
    height: 10,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.border.light,
  },
  itemChip: {
    width: '90%',
    height: 24,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.border.light,
  },
});
