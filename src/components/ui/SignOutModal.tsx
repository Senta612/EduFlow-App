import React, { useState, useCallback } from 'react';
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
      animationType="none"
      onRequestClose={isSigningOut ? undefined : onClose}
    >
      <View style={styles.overlay}>
        {/* Subtle Backdrop Fade */}
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.backdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={isSigningOut ? undefined : onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>

        {/* Modal Dialog Card with Crisp Subtle Fade */}
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
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

          {/* Clean Static Icon Badge */}
          <View style={styles.iconCircle}>
            <Feather name="log-out" size={24} color={theme.colors.state.danger} />
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 356,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
  },
  closeIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
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
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 13,
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
    fontSize: 11.5,
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
    gap: 9,
  },
  confirmButton: {
    width: '100%',
    height: 44,
    borderRadius: 11,
    backgroundColor: theme.colors.state.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.99 }],
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
    marginRight: 7,
  },
  confirmButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    width: '100%',
    height: 42,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.99 }],
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});
