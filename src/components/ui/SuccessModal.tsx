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
          iconBadge: styles.statIconBadgeSuccess,
          number: styles.statNumberSuccess,
          label: styles.statLabelSuccess,
          iconColor: theme.colors.semantic.success.main,
        };
      case 'warning':
        return {
          container: styles.statBoxWarning,
          iconBadge: styles.statIconBadgeWarning,
          number: styles.statNumberWarning,
          label: styles.statLabelWarning,
          iconColor: theme.colors.semantic.warning.main,
        };
      case 'danger':
        return {
          container: styles.statBoxDanger,
          iconBadge: styles.statIconBadgeDanger,
          number: styles.statNumberDanger,
          label: styles.statLabelDanger,
          iconColor: theme.colors.semantic.danger.main,
        };
      case 'primary':
        return {
          container: styles.statBoxPrimary,
          iconBadge: styles.statIconBadgePrimary,
          number: styles.statNumberPrimary,
          label: styles.statLabelPrimary,
          iconColor: theme.colors.primary.main,
        };
      case 'neutral':
      default:
        return {
          container: styles.statBoxNeutral,
          iconBadge: styles.statIconBadgeNeutral,
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
                    <View style={styles.contextPillIconWrapper}>
                      <Feather
                        name={contextBadge.icon}
                        size={13}
                        color={theme.colors.primary.main}
                      />
                    </View>
                  )}
                  <Text variant="caption" style={styles.contextPillText} numberOfLines={2}>
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
                    const isLongText = String(st.value).length > 3;

                    return (
                      <View
                        key={`stat-${index}`}
                        style={[styles.statBox, stStyles.container]}
                      >
                        {st.icon && (
                          <View
                            style={[
                              styles.statIconBadge,
                              stStyles.iconBadge,
                              isZeroDisabled && styles.statIconBadgeDisabled,
                            ]}
                          >
                            <Feather
                              name={st.icon}
                              size={13}
                              color={isZeroDisabled ? theme.colors.text.disabled : stStyles.iconColor}
                            />
                          </View>
                        )}
                        <Text
                          variant={isLongText ? 'body' : 'heading'}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[
                            styles.statValueBase,
                            isLongText ? styles.statTextLong : styles.statNumber,
                            stStyles.number,
                            isZeroDisabled && styles.statTextDisabled,
                          ]}
                        >
                          {st.value}
                        </Text>
                        <Text
                          variant="caption"
                          numberOfLines={1}
                          style={[
                            styles.statLabelBase,
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
const cardMaxWidth = Math.min(width - 32, 380);

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
    padding: theme.spacing.md,
  },
  cardContainer: {
    width: '100%',
    maxWidth: cardMaxWidth,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
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
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
  },
  contextPillIconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextPillText: {
    color: theme.colors.primary.dark,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 74,
  },
  statIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statIconBadgeNeutral: {
    backgroundColor: '#EEF2F6',
  },
  statIconBadgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  statIconBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statIconBadgeWarning: {
    backgroundColor: '#FEF9C3',
  },
  statIconBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  statIconBadgeDisabled: {
    backgroundColor: '#F1F5F9',
  },
  statValueBase: {
    textAlign: 'center',
    width: '100%',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 20,
  },
  statTextLong: {
    fontSize: 12.5,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 16,
  },
  statLabelBase: {
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  statBoxNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statNumberNeutral: {
    color: theme.colors.text.primary,
  },
  statLabelNeutral: {
    color: theme.colors.text.secondary,
  },
  statBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statNumberSuccess: {
    color: theme.colors.semantic.success.main,
  },
  statLabelSuccess: {
    color: theme.colors.semantic.success.main,
  },
  statBoxWarning: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  statNumberWarning: {
    color: theme.colors.semantic.warning.main,
  },
  statLabelWarning: {
    color: theme.colors.semantic.warning.main,
  },
  statBoxDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statNumberDanger: {
    color: theme.colors.semantic.danger.main,
  },
  statLabelDanger: {
    color: theme.colors.semantic.danger.main,
  },
  statBoxPrimary: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  statNumberPrimary: {
    color: theme.colors.primary.dark,
  },
  statLabelPrimary: {
    color: theme.colors.primary.main,
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
