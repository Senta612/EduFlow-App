import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { theme } from '@/theme';

export interface CircularProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  showPercentageText?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Senior Developer Pattern: Lightweight, Native-performant Circular Progress Ring
 * Pure React Native layout (no external heavy canvas dependency).
 */
export function CircularProgressRing({
  percentage,
  size = 80,
  strokeWidth = 7,
  label,
  sublabel,
  showPercentage = true,
  showPercentageText,
  color,
  style,
}: CircularProgressRingProps) {
  const clampedPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const displayPercentage = showPercentageText !== undefined ? showPercentageText : showPercentage;

  // Dynamic semantic color based on educational threshold
  const activeColor =
    color ||
    (clampedPct >= 85
      ? theme.colors.semantic.success.main
      : clampedPct >= 75
      ? theme.colors.semantic.warning.main
      : theme.colors.semantic.danger.main);

  const radius = size / 2;
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.outerCircle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: '#E2E8F0',
          },
        ]}
      >
        {/* Dynamic Highlight Indicator Ring */}
        <View
          style={[
            styles.accentRing,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderTopColor: activeColor,
              borderRightColor: clampedPct >= 25 ? activeColor : 'transparent',
              borderBottomColor: clampedPct >= 50 ? activeColor : 'transparent',
              borderLeftColor: clampedPct >= 75 ? activeColor : 'transparent',
              transform: [{ rotateZ: '-45deg' }],
            },
          ]}
        />

        {/* Center Content */}
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          {displayPercentage && (
            <Text
              style={[
                styles.percentageText,
                { color: activeColor, fontSize: size * 0.22 },
              ]}
            >
              {clampedPct}%
            </Text>
          )}
          {sublabel && (
            <Text variant="caption" style={styles.sublabelText}>
              {sublabel}
            </Text>
          )}
        </View>
      </View>

      {label && (
        <Text variant="label" style={styles.labelText}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outerCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  accentRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  percentageText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  sublabelText: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    marginTop: -2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
