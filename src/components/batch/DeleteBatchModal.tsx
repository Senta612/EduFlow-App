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
import { Batch } from '@/types/teacher';
import { theme } from '@/theme';

export interface DeleteBatchModalProps {
  visible: boolean;
  batch: Batch | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteBatchModal({
  visible,
  batch,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}: DeleteBatchModalProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.25);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.25;
    }
  }, [visible, pulseScale, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (!batch) return null;

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
        <Pressable style={styles.backdropPressable} onPress={isDeleting ? undefined : onClose}>
          <Animated.View
            entering={ZoomIn.springify().damping(16).stiffness(140).mass(0.9)}
            exiting={ZoomOut.duration(160)}
            style={styles.cardContainer}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardInner}>
              {/* Close Button */}
              <Pressable
                onPress={onClose}
                disabled={isDeleting}
                hitSlop={12}
                style={[styles.closeButton, isDeleting && styles.disabledButton]}
                accessibilityRole="button"
                accessibilityLabel="Close delete modal"
              >
                <Feather name="x" size={18} color={theme.colors.text.secondary} />
              </Pressable>

              {/* Animated Danger Icon Badge */}
              <View style={styles.iconWrapper}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { backgroundColor: 'rgba(220, 38, 38, 0.22)' },
                    animatedPulseStyle,
                  ]}
                />
                <Animated.View
                  entering={ZoomIn.delay(120).springify().damping(11).stiffness(160)}
                  style={styles.iconCircle}
                >
                  <Feather name="trash-2" size={26} color="#FFFFFF" />
                </Animated.View>
              </View>

              {/* Title & Subtitle */}
              <Text variant="heading" style={styles.title}>
                Delete Batch?
              </Text>
              <Text variant="body" style={styles.subtitle}>
                Are you sure you want to permanently remove this teaching batch?
              </Text>

              {/* Batch Overview Target Card */}
              <View style={styles.batchInfoCard}>
                <View style={styles.batchHeaderRow}>
                  <View style={styles.batchTitleWrap}>
                    <Text variant="heading" numberOfLines={1} style={styles.batchName}>
                      {batch.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1} style={styles.batchSubjectGrade}>
                      {batch.grade} • {batch.subject}
                    </Text>
                  </View>
                  <View style={styles.studentBadge}>
                    <Feather name="users" size={12} color={theme.colors.primary.main} />
                    <Text variant="caption" style={styles.studentBadgeText}>
                      {batch.studentCount || 0}
                    </Text>
                  </View>
                </View>

                {/* Schedule Line */}
                <View style={styles.scheduleRow}>
                  <Feather name="calendar" size={12} color={theme.colors.text.secondary} />
                  <Text variant="caption" numberOfLines={1} style={styles.scheduleText}>
                    {batch.schedule} • {batch.timing}
                  </Text>
                </View>
              </View>

              {/* Permanent Warning Box */}
              <View style={styles.warningBox}>
                <Feather
                  name="alert-triangle"
                  size={16}
                  color={theme.colors.semantic.danger.main}
                  style={styles.warningIcon}
                />
                <Text variant="caption" style={styles.warningText}>
                  This action cannot be undone. All attendance history, student enrollments, homework, and test marks will be deleted.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGroup}>
                <Button
                  title="Yes, Delete Batch"
                  variant="danger"
                  icon="trash-2"
                  size="md"
                  fullWidth
                  loading={isDeleting}
                  disabled={isDeleting}
                  onPress={onConfirmDelete}
                />
                <Button
                  title="Keep Batch"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  disabled={isDeleting}
                  onPress={onClose}
                  style={styles.cancelBtn}
                />
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
  disabledButton: {
    opacity: 0.5,
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
    backgroundColor: theme.colors.semantic.danger.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.semantic.danger.main,
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
  batchInfoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 8,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  batchTitleWrap: {
    flex: 1,
    gap: 2,
  },
  batchName: {
    fontSize: 15,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  batchSubjectGrade: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  studentBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary.dark,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  scheduleText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
    gap: 8,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#991B1B',
    fontWeight: theme.typography.weights.medium,
  },
  actionGroup: {
    width: '100%',
    gap: 8,
  },
  cancelBtn: {
    marginTop: 2,
  },
});
