import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';

export interface AttendanceSuccessData {
  batchName: string;
  grade?: string;
  subject?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  date?: string;
  timing?: string;
}

export interface AttendanceSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  data: AttendanceSuccessData | null;
  onViewBatch?: () => void;
}

export function AttendanceSuccessModal({
  visible,
  onClose,
  data,
  onViewBatch,
}: AttendanceSuccessModalProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.25);
  const progressFill = useSharedValue(0);

  const total = data?.totalStudents || 0;
  const present = data?.presentCount || 0;
  const absent = data?.absentCount || 0;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const isPerfectAttendance = total > 0 && absent === 0;

  useEffect(() => {
    if (visible) {
      // Soft breathing glow on outer checkmark ring
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );

      // Smooth progress bar fill
      progressFill.value = 0;
      progressFill.value = withTiming(attendanceRate, {
        duration: 750,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.25;
      progressFill.value = 0;
    }
  }, [visible, attendanceRate, pulseScale, pulseOpacity, progressFill]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progressFill.value))}%`,
  }));

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed backdrop with Reanimated Fade */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          {/* Card Dialog with Reanimated Spring Pop */}
          <Animated.View
            entering={ZoomIn.springify().damping(16).stiffness(140).mass(0.9)}
            exiting={ZoomOut.duration(160)}
            style={styles.cardContainer}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardInner}>
              {/* Dismiss Button */}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close confirmation dialog"
              >
                <Feather name="x" size={18} color={theme.colors.text.secondary} />
              </Pressable>

              {/* Reanimated Animated Success Icon Badge */}
              <View style={styles.iconWrapper}>
                <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                <Animated.View
                  entering={ZoomIn.delay(120).springify().damping(11).stiffness(160)}
                  style={styles.iconCircle}
                >
                  <Feather name="check" size={28} color="#FFFFFF" />
                </Animated.View>
              </View>

              {/* Title & Subtitle */}
              <Text variant="heading" style={styles.title}>
                Attendance Recorded!
              </Text>
              <Text variant="body" style={styles.subtitle}>
                {isPerfectAttendance
                  ? 'All enrolled students are present today. Outstanding!'
                  : 'Daily attendance roster has been successfully logged.'}
              </Text>

              {/* Batch Context Pill */}
              <View style={styles.batchPill}>
                <Feather
                  name="book-open"
                  size={13}
                  color={theme.colors.primary.main}
                  style={styles.batchPillIcon}
                />
                <Text variant="caption" style={styles.batchPillText} numberOfLines={1}>
                  {data.batchName}
                  {data.grade ? ` • ${data.grade}` : ''}
                  {data.subject ? ` • ${data.subject}` : ''}
                </Text>
              </View>

              {/* 3-Column Key Metric Breakdown Grid */}
              <View style={styles.statsGrid}>
                {/* Total */}
                <View style={[styles.statBox, styles.statBoxTotal]}>
                  <Text variant="heading" style={styles.statNumberTotal}>
                    {total}
                  </Text>
                  <Text variant="caption" style={styles.statLabel}>
                    Total
                  </Text>
                </View>

                {/* Present */}
                <View style={[styles.statBox, styles.statBoxPresent]}>
                  <View style={styles.statHeaderRow}>
                    <Feather
                      name="check-circle"
                      size={12}
                      color={theme.colors.semantic.success.main}
                    />
                    <Text variant="heading" style={styles.statNumberPresent}>
                      {present}
                    </Text>
                  </View>
                  <Text variant="caption" style={styles.statLabelPresent}>
                    Present
                  </Text>
                </View>

                {/* Absent */}
                <View style={[styles.statBox, styles.statBoxAbsent]}>
                  <View style={styles.statHeaderRow}>
                    <Feather
                      name="x-circle"
                      size={12}
                      color={absent > 0 ? theme.colors.semantic.danger.main : theme.colors.text.disabled}
                    />
                    <Text
                      variant="heading"
                      style={[
                        styles.statNumberAbsent,
                        absent === 0 && styles.statNumberAbsentZero,
                      ]}
                    >
                      {absent}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    style={[
                      styles.statLabelAbsent,
                      absent === 0 && styles.statLabelAbsentZero,
                    ]}
                  >
                    Absent
                  </Text>
                </View>
              </View>

              {/* Attendance Rate Progress Bar with Dynamic Fill */}
              <View style={styles.rateContainer}>
                <View style={styles.rateHeader}>
                  <Text variant="caption" style={styles.rateLabel}>
                    Class Turnout Rate
                  </Text>
                  <Text variant="caption" style={styles.rateValue}>
                    {attendanceRate}%
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      animatedProgressStyle,
                      attendanceRate < 50 && styles.progressBarFillLow,
                    ]}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGroup}>
                <Button
                  title="Done"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={onClose}
                />
                {onViewBatch && (
                  <Button
                    title="View Batch Details"
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onPress={onViewBatch}
                    style={styles.secondaryBtn}
                  />
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = Math.min(width - 40, 360);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  cardContainer: {
    width: cardWidth,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardInner: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.semantic.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.semantic.success.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  batchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
  },
  batchPillIcon: {
    marginRight: 6,
  },
  batchPillText: {
    color: theme.colors.primary.dark,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statBoxTotal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statNumberTotal: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statBoxPresent: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumberPresent: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.semantic.success.main,
  },
  statLabelPresent: {
    fontSize: 11,
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statBoxAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statNumberAbsent: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.semantic.danger.main,
  },
  statNumberAbsentZero: {
    color: theme.colors.text.disabled,
  },
  statLabelAbsent: {
    fontSize: 11,
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statLabelAbsentZero: {
    color: theme.colors.text.disabled,
  },
  rateContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rateLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  rateValue: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.bold,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.semantic.success.main,
    borderRadius: 4,
  },
  progressBarFillLow: {
    backgroundColor: theme.colors.semantic.warning.main,
  },
  actionGroup: {
    width: '100%',
    gap: 8,
  },
  secondaryBtn: {
    marginTop: 2,
  },
});
