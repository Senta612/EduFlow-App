import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Linking,
  Platform,
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
import { router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { getFriendlyAuthMessage, resendVerificationEmail } from '@/services/auth.service';
import { theme } from '@/theme';

export interface EmailConfirmationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onGoToLogin?: () => void;
  title?: string;
  subtitle?: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailConfirmationModal({
  visible,
  email,
  onClose,
  onGoToLogin,
  title = 'Verify Your Email',
  subtitle,
}: EmailConfirmationModalProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Animation shared values for pulsing aura
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.12, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.3;
      setFeedback(null);
    }
  }, [visible, pulseScale, pulseOpacity]);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleOpenMailApp = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const messageUrl = 'message://';
        const canOpen = await Linking.canOpenURL(messageUrl);
        if (canOpen) {
          await Linking.openURL(messageUrl);
          return;
        }
      }

      // Android or iOS fallback: mailto scheme
      const mailtoUrl = `mailto:${email ? encodeURIComponent(email) : ''}`;
      const canOpenMailto = await Linking.canOpenURL(mailtoUrl);
      if (canOpenMailto) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Web / Generic fallback
        await Linking.openURL('https://mail.google.com');
      }
    } catch {
      // Fallback in case device doesn't have a mail handler
      setFeedback({
        type: 'error',
        message: 'Could not launch mail client automatically. Please open your email app manually.',
      });
    }
  }, [email]);

  const handleResendEmail = useCallback(async () => {
    if (!email || cooldown > 0 || isResending) return;

    setIsResending(true);
    setFeedback(null);

    try {
      const { error, errorKind } = await resendVerificationEmail(email);

      if (error || errorKind) {
        setFeedback({
          type: 'error',
          message: getFriendlyAuthMessage(errorKind ?? 'unknown'),
        });
      } else {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setFeedback({
          type: 'success',
          message: 'Verification link resent! Please check your inbox and spam folder.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to resend email right now. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  }, [email, cooldown, isResending]);

  const handleGoToLogin = useCallback(() => {
    onClose();
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      router.replace('/login');
    }
  }, [onClose, onGoToLogin]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Animated.View
            entering={ZoomIn.springify().damping(18).stiffness(150).mass(0.9)}
            exiting={ZoomOut.duration(180)}
            style={styles.cardContainer}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardInner}>
              {/* Top Close Button */}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close verification modal"
              >
                <Feather name="x" size={18} color={theme.colors.text.secondary} />
              </Pressable>

              {/* Glowing Animated Icon Badge */}
              <View style={styles.iconWrapper}>
                <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                <Animated.View
                  entering={ZoomIn.delay(120).springify().damping(12).stiffness(160)}
                  style={styles.iconCircle}
                >
                  <Feather name="mail" size={28} color="#FFFFFF" />
                  <View style={styles.iconSubBadge}>
                    <Feather name="check" size={11} color="#FFFFFF" />
                  </View>
                </Animated.View>
              </View>

              {/* Title & Explanatory Subtitle */}
              <View style={styles.textContainer}>
                <Text variant="heading" style={styles.title}>
                  {title}
                </Text>
                <Text variant="body" style={styles.subtitle}>
                  {subtitle ??
                    "We've sent an activation link to your email address. Please verify your email to unlock your account."}
                </Text>
              </View>

              {/* Email Address Highlight Pill */}
              {email ? (
                <View style={styles.emailPill}>
                  <Feather name="at-sign" size={15} color={theme.colors.primary.main} />
                  <Text variant="label" style={styles.emailText} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              ) : null}

              {/* In-Modal Feedback Alert */}
              {feedback && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[
                    styles.feedbackBanner,
                    feedback.type === 'success'
                      ? styles.feedbackBannerSuccess
                      : styles.feedbackBannerError,
                  ]}
                >
                  <Feather
                    name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'}
                    size={16}
                    color={
                      feedback.type === 'success'
                        ? theme.colors.semantic.success.main
                        : theme.colors.semantic.danger.main
                    }
                  />
                  <Text
                    variant="caption"
                    style={[
                      styles.feedbackText,
                      feedback.type === 'success'
                        ? styles.feedbackTextSuccess
                        : styles.feedbackTextError,
                    ]}
                  >
                    {feedback.message}
                  </Text>
                </Animated.View>
              )}

              {/* Primary & Secondary Action Buttons */}
              <View style={styles.actionsContainer}>
                <Button
                  title="Open Mail App"
                  icon="external-link"
                  fullWidth
                  onPress={handleOpenMailApp}
                />

                <Button
                  title={
                    isResending
                      ? 'Sending...'
                      : cooldown > 0
                        ? `Resend available in ${cooldown}s`
                        : 'Resend Verification Email'
                  }
                  variant="outline"
                  icon={isResending ? undefined : 'refresh-cw'}
                  loading={isResending}
                  disabled={cooldown > 0 || isResending}
                  fullWidth
                  onPress={handleResendEmail}
                />
              </View>

              {/* Spam Tip Footer Notice */}
              <View style={styles.tipsBox}>
                <Feather
                  name="info"
                  size={14}
                  color={theme.colors.semantic.info.main}
                  style={styles.tipIcon}
                />
                <Text variant="caption" style={styles.tipsText}>
                  Didn't receive the email? Check your Spam or Junk folder, or ensure the address
                  above is correct.
                </Text>
              </View>

              {/* Bottom Navigation Link */}
              <Pressable onPress={handleGoToLogin} hitSlop={8} style={styles.goToLoginButton}>
                <Text variant="label" style={styles.goToLoginText}>
                  Back to Sign In
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },

  backdropPressable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },

  cardInner: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.xl ?? 24,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  iconWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },

  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  iconSubBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.semantic.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  textContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },

  title: {
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
  },

  subtitle: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.xs,
  },

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radii.full ?? 999,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    maxWidth: '100%',
  },

  emailText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.semibold,
    flexShrink: 1,
  },

  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },

  feedbackBannerSuccess: {
    backgroundColor: theme.colors.semantic.success.bg,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },

  feedbackBannerError: {
    backgroundColor: theme.colors.semantic.danger.bg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },

  feedbackText: {
    flex: 1,
    fontWeight: theme.typography.weights.medium,
  },

  feedbackTextSuccess: {
    color: theme.colors.semantic.success.main,
  },

  feedbackTextError: {
    color: theme.colors.semantic.danger.main,
  },

  actionsContainer: {
    width: '100%',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.semantic.info.bg,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    gap: theme.spacing.xs,
    width: '100%',
    marginBottom: theme.spacing.sm,
  },

  tipIcon: {
    marginTop: 2,
  },

  tipsText: {
    flex: 1,
    color: theme.colors.semantic.info.main,
    fontSize: 12,
    lineHeight: 16,
  },

  goToLoginButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },

  goToLoginText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
});
