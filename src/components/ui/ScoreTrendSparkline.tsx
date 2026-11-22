import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { Badge } from './Badge';
import { theme } from '@/theme';

export interface ScoreItem {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  date?: string;
}

export interface ScoreTrendSparklineProps {
  scores: ScoreItem[];
  title?: string;
  maxBars?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScoreTrendSparkline({
  scores,
  title = 'Assessment Performance Trend',
  maxBars = 5,
  style,
}: ScoreTrendSparklineProps) {
  if (scores.length === 0) {
    return null;
  }

  const recent = scores.slice(-maxBars);

  // Calculate academic trajectory
  const trajectory = (() => {
    if (recent.length < 2) return { label: 'Initial Baseline', variant: 'neutral' as const, icon: 'minus' as const };
    const latestPct = (recent[recent.length - 1].score / (recent[recent.length - 1].maxScore || 1)) * 100;
    const prevPct = (recent[0].score / (recent[0].maxScore || 1)) * 100;
    const diff = latestPct - prevPct;

    if (diff > 5) {
      return { label: `+${Math.round(diff)}% Improving`, variant: 'success' as const, icon: 'trending-up' as const };
    }
    if (diff < -5) {
      return { label: `${Math.round(diff)}% Review Needed`, variant: 'warning' as const, icon: 'trending-down' as const };
    }
    return { label: 'Consistent', variant: 'info' as const, icon: 'activity' as const };
  })();

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Feather name="bar-chart-2" size={16} color={theme.colors.primary.main} />
          <Text variant="label" style={styles.titleText}>
            {title}
          </Text>
        </View>
        <Badge
          label={trajectory.label}
          variant={trajectory.variant}
          size="sm"
          icon={trajectory.icon}
        />
      </View>

      {/* Bars Chart Area */}
      <View style={styles.chartContainer}>
        {recent.map((item, index) => {
          const pct = Math.min(100, Math.max(0, Math.round((item.score / (item.maxScore || 1)) * 100)));
          const isLatest = index === recent.length - 1;

          const barColor =
            pct >= 80
              ? theme.colors.semantic.success.main
              : pct >= 60
              ? theme.colors.primary.main
              : theme.colors.semantic.warning.main;

          return (
            <View key={item.id} style={styles.barColumn}>
              {/* Score pill above bar */}
              <Text variant="caption" style={[styles.barPctLabel, isLatest && styles.barPctLabelActive]}>
                {pct}%
              </Text>

              {/* Bar track and fill */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.max(12, pct)}%`,
                      backgroundColor: barColor,
                      opacity: isLatest ? 1 : 0.75,
                    },
                  ]}
                />
              </View>

              {/* Test Name / Index below */}
              <Text
                variant="caption"
                numberOfLines={1}
                style={[styles.barBottomLabel, isLatest && styles.barBottomLabelActive]}
              >
                T{index + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: 16,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barPctLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  barPctLabelActive: {
    color: theme.colors.text.primary,
  },
  barTrack: {
    width: 22,
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barBottomLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  barBottomLabelActive: {
    color: theme.colors.primary.main,
    fontWeight: '800',
  },
});
