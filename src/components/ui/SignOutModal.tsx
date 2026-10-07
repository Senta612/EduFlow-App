import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ActivityIndicator,
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
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  showUserCard?: boolean;
}

export function SignOutModal({
  visible,
  onClose,
  onConfirm,
  title,
  subtitle,
  confirmText,
  cancelText,
  userName,
  userEmail,
  userRole,
  showUserCard = true,
}: SignOutModalProps) {
  const { signOut, user, profile, studentSession } = useAuth();
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Animated pulse values for the danger halo
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.12, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.3;
      setIsSigningOut(false);
    }
  }, [visible, pulseScale, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Resolve display metadata for current session
  const displayName =
    userName ||
    profile?.full_name ||
    studentSession?.studentName ||
    user?.email?.split('@')[0] ||
    'EduFlow User';

  const displayEmail =
    userEmail ||
    user?.email ||
    (studentSession?.enrolledBatch?.batchName
      ? `Batch: ${studentSession.enrolledBatch.batchName}`
      : undefined);

  const displayRole =
    userRole ||
    (studentSession
      ? t('auth.roleStudent')
      : profile?.role === 'teacher' || !profile?.role
      ? t('auth.roleTeacher')
      : t('auth.roleStudent'));

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  const modalTitle =
    title ||
    (studentSession ? t('auth.studentSignOutTitle') : t('auth.signOut'));

  const modalSubtitle =
    subtitle ||
    (studentSession
      ? t('auth.studentSignOutSubtitle')
      : t('auth.signOutDialogSubtitle'));

  const modalConfirmText =
    confirmText ||
    (studentSession ? t('auth.exitPortal') : t('auth.signOut'));

  const modalCancelText = cancelText || t('auth.staySignedIn');

  const handleConfirm = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        await signOut();
      }
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, onConfirm, signOut, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isSigningOut ? undefined : onClose}
    >
      <View style={styles.overlay}>
        {/* Animated backdrop */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={isSigningOut ? undefined : onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>

        {/* Modal Dialog Card */}
        <Animated.View
          entering={ZoomIn.duration(240).springify().damping(18)}
          exiting={ZoomOut.duration(150)}
          style={styles.cardContainer}
        >
          {/* Close button top right */}
          <Pressable
            onPress={isSigningOut ? undefined : onClose}
            style={({ pressed }) => [
              styles.closeIconButton,
              pressed && styles.closeIconButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            disabled={isSigningOut}
          >
            <Feather name="x" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          {/* Hero Icon with Breathing Pulse Aura */}
          <View style={styles.iconCenterWrapper}>
            <Animated.View style={[styles.pulseAura, animatedPulseStyle]} />
            <View style={styles.iconCircle}>
              <Feather name="log-out" size={26} color={theme.colors.state.danger} />
            </View>
          </View>

          {/* Header Texts */}
          <View style={styles.textContainer}>
            <Text variant="heading2" style={styles.titleText}>
              {modalTitle}
            </Text>
            <Text variant="body2" style={styles.subtitleText}>
              {modalSubtitle}
            </Text>
          </View>

          {/* User Profile Context Chip */}
          {showUserCard && displayName && (
            <View style={styles.userCard}>
              <View style={styles.userRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRoleRow}>
                    <Text variant="label" numberOfLines={1} style={styles.userName}>
                      {displayName}
                    </Text>
                    <Badge
                      label={displayRole}
                      variant={studentSession ? 'info' : 'primary'}
                      size="sm"
                    />
                  </View>
                  {displayEmail && (
                    <Text variant="caption" numberOfLines={1} style={styles.userSubtext}>
                      {displayEmail}
                    </Text>
                  )}
                </View>
              </View>

              {/* Data Safety Note */}
              <View style={styles.safetyRow}>
                <Feather
                  name="shield"
                  size={12}
                  color={theme.colors.state.success}
                  style={styles.safetyIcon}
                />
                <Text variant="caption" style={styles.safetyText}>
                  {t('auth.sessionSafeNote')}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionColumn}>
            {/* Confirm Destructive Sign Out Button */}
            <Pressable
              onPress={handleConfirm}
              disabled={isSigningOut}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && !isSigningOut && styles.confirmButtonPressed,
                isSigningOut && styles.confirmButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={modalConfirmText}
            >
              {isSigningOut ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                  <Text style={styles.confirmButtonText}>
                    {t('auth.signingOut')}
                  </Text>
                </View>
              ) : (
                <View style={styles.btnContentRow}>
                  <Feather
                    name="log-out"
                    size={16}
                    color={theme.colors.text.inverse}
                    style={styles.btnIcon}
                  />
                  <Text style={styles.confirmButtonText}>
                    {modalConfirmText}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Stay Signed In / Cancel Button */}
            <Pressable
              onPress={onClose}
              disabled={isSigningOut}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !isSigningOut && styles.cancelButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={modalCancelText}
            >
              <Text style={styles.cancelButtonText}>
                {modalCancelText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
  closeIconButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  closeIconButtonPressed: {
    backgroundColor: '#F1F5F9',
    transform: [{ scale: 0.94 }],
  },
  iconCenterWrapper: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseAura: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.state.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  userCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  userInfo: {
    flex: 1,
  },
  userNameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  userSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  safetyIcon: {
    marginRight: 5,
  },
  safetyText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  actionColumn: {
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.state.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.state.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.985 }],
  },
  confirmButtonDisabled: {
    opacity: 0.75,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    letterSpacing: -0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.985 }],
  },
  cancelButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#475569',
  },
});
