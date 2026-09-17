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
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';

export type SuccessModalVariant = 'success' | 'primary' | 'warning' | 'info' | 'danger';

export interface ModalStatItem {
  label: string;
  value: string | number;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
  icon?: keyof typeof Feather.glyphMap;
}

export interface ModalProgress {
  label: string;
  percentage: number;
  variant?: 'success' | 'warning' | 'primary' | 'danger';
}

export interface ModalAction {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  icon?: keyof typeof Feather.glyphMap;
}

export interface ModalContextBadge {
  icon?: keyof typeof Feather.glyphMap;
  label: string;
}

export interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeIcon?: keyof typeof Feather.glyphMap;
  badgeVariant?: SuccessModalVariant;
  contextBadge?: ModalContextBadge;
  stats?: ModalStatItem[];
  progress?: ModalProgress;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
}

export function SuccessModal({
  visible,
  onClose,
  title,
  subtitle,
  badgeIcon = 'check',
  badgeVariant = 'success',
  contextBadge,
  stats,
  progress,
  primaryAction,
  secondaryAction,
}: SuccessModalProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.25);
  const progressFill = useSharedValue(0);

  const percentage = progress ? Math.min(100, Math.max(0, progress.percentage)) : 0;

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
      if (progress) {
        progressFill.value = 0;
        progressFill.value = withTiming(percentage, {
          duration: 750,
          easing: Easing.out(Easing.cubic),
        });
      }
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.25;
      progressFill.value = 0;
    }
  }, [visible, percentage, progress, pulseScale, pulseOpacity, progressFill]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressFill.value}%`,
  }));

  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'primary':
        return {
          main: theme.colors.primary.main,
          glow: 'rgba(37, 99, 235, 0.22)',
        };
      case 'warning':
        return {
          main: theme.colors.semantic.warning.main,
          glow: 'rgba(217, 119, 6, 0.22)',
        };
      case 'danger':
        return {
          main: theme.colors.semantic.danger.main,
          glow: 'rgba(220, 38, 38, 0.22)',
        };
      case 'info':
        return {
          main: theme.colors.semantic.info.main,
          glow: 'rgba(2, 132, 199, 0.22)',
        };
      case 'success':
      default:
        return {
          main: theme.colors.semantic.success.main,
          glow: 'rgba(34, 197, 94, 0.22)',
        };
    }
  };

  const getStatStyles = (variant: ModalStatItem['variant'] = 'neutral') => {
    switch (variant) {
      case 'success':
        return {
          container: styles.statBoxSuccess,
          number: styles.statNumberSuccess,
          label: styles.statLabelSuccess,
          iconColor: theme.colors.semantic.success.main,
        };
      case 'warning':
        return {
          container: styles.statBoxWarning,
          number: styles.statNumberWarning,
          label: styles.statLabelWarning,
          iconColor: theme.colors.semantic.warning.main,
        };
      case 'danger':
        return {
          container: styles.statBoxDanger,
          number: styles.statNumberDanger,
          label: styles.statLabelDanger,
          iconColor: theme.colors.semantic.danger.main,
        };
      case 'primary':
        return {
          container: styles.statBoxPrimary,
          number: styles.statNumberPrimary,
          label: styles.statLabelPrimary,
          iconColor: theme.colors.primary.main,
        };
      case 'neutral':
      default:
        return {
          container: styles.statBoxNeutral,
          number: styles.statNumberNeutral,
          label: styles.statLabelNeutral,
          iconColor: theme.colors.text.secondary,
        };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Animated.View
            entering={ZoomIn.springify().damping(16).stiffness(140).mass(0.9)}
            exiting={ZoomOut.duration(160)}
            style={styles.cardContainer}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardInner}>
              {/* Close Button */}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close confirmation modal"
              >
                <Feather name="x" size={18} color={theme.colors.text.secondary} />
              </Pressable>

              {/* Animated Icon Badge */}
              <View style={styles.iconWrapper}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { backgroundColor: badgeColors.glow },
                    animatedPulseStyle,
                  ]}
                />
                <Animated.View
                  entering={ZoomIn.delay(120).springify().damping(11).stiffness(160)}
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: badgeColors.main,
                      shadowColor: badgeColors.main,
                    },
                  ]}
                >
                  <Feather name={badgeIcon} size={28} color="#FFFFFF" />
                </Animated.View>
              </View>

              {/* Title & Subtitle */}
              <Text variant="heading" style={styles.title}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="body" style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}

              {/* Context Pill Badge */}
              {contextBadge && (
                <View style={styles.contextPill}>
                  {contextBadge.icon && (
                    <Feather
                      name={contextBadge.icon}
                      size={13}
                      color={theme.colors.primary.main}
                      style={styles.contextPillIcon}
                    />
                  )}
                  <Text variant="caption" style={styles.contextPillText} numberOfLines={1}>
                    {contextBadge.label}
                  </Text>
                </View>
              )}

              {/* Stats Breakdown Grid */}
              {stats && stats.length > 0 && (
                <View style={styles.statsGrid}>
                  {stats.map((st, index) => {
                    const stStyles = getStatStyles(st.variant);
                    const isZeroDisabled =
                      st.variant === 'danger' && (st.value === 0 || st.value === '0');

                    return (
                      <View
                        key={`stat-${index}`}
                        style={[styles.statBox, stStyles.container]}
                      >
                        <View style={styles.statHeaderRow}>
                          {st.icon && (
                            <Feather
                              name={st.icon}
                              size={12}
                              color={isZeroDisabled ? theme.colors.text.disabled : stStyles.iconColor}
                            />
                          )}
                          <Text
                            variant="heading"
                            style={[
                              stStyles.number,
                              isZeroDisabled && styles.statTextDisabled,
                            ]}
                          >
                            {st.value}
                          </Text>
                        </View>
                        <Text
                          variant="caption"
                          style={[
                            stStyles.label,
                            isZeroDisabled && styles.statTextDisabled,
                          ]}
                        >
                          {st.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Progress Rate Bar */}
              {progress && (
                <View style={styles.rateContainer}>
                  <View style={styles.rateHeader}>
                    <Text variant="caption" style={styles.rateLabel}>
                      {progress.label}
                    </Text>
                    <Text variant="caption" style={styles.rateValue}>
                      {percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        animatedProgressStyle,
                        percentage < 50 && styles.progressBarFillLow,
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionGroup}>
                {primaryAction ? (
                  <Button
                    title={primaryAction.title}
                    variant={primaryAction.variant || 'primary'}
                    icon={primaryAction.icon}
                    size="md"
                    fullWidth
                    onPress={primaryAction.onPress}
                  />
                ) : (
                  <Button
                    title="Done"
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={onClose}
                  />
                )}
                {secondaryAction && (
                  <Button
                    title={secondaryAction.title}
                    variant={secondaryAction.variant || 'ghost'}
                    icon={secondaryAction.icon}
                    size="sm"
                    fullWidth
                    onPress={secondaryAction.onPress}
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
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
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
  contextPill: {
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
  contextPillIcon: {
    marginRight: 6,
  },
  contextPillText: {
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
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBoxNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statNumberNeutral: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  statLabelNeutral: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statNumberSuccess: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.semantic.success.main,
  },
  statLabelSuccess: {
    fontSize: 11,
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statBoxWarning: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  statNumberWarning: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.semantic.warning.main,
  },
  statLabelWarning: {
    fontSize: 11,
    color: theme.colors.semantic.warning.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statBoxDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statNumberDanger: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.semantic.danger.main,
  },
  statLabelDanger: {
    fontSize: 11,
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statBoxPrimary: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  statNumberPrimary: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary.dark,
  },
  statLabelPrimary: {
    fontSize: 11,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  statTextDisabled: {
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
