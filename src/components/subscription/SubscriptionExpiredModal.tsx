import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/theme';

export interface SubscriptionExpiredModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  title?: string;
  subtitle?: string;
}

export function SubscriptionExpiredModal({
  visible,
  onClose,
  featureName,
  title,
  subtitle,
}: SubscriptionExpiredModalProps) {
  const router = useRouter();

  const handleRenew = () => {
    onClose();
    router.push('/(teacher)/subscription/plans');
  };

  const actionText = featureName ? ` to ${featureName}` : '';
  const resolvedTitle = title || 'Pro Access Required';
  const resolvedSubtitle =
    subtitle ||
    `Your active subscription or trial has ended. Renew your plan${actionText}.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalContent}
        >
          {/* Lock / Alert Header Icon */}
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircle}>
              <Feather name="lock" size={28} color="#DC2626" />
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text variant="heading" style={styles.modalTitle}>
            {resolvedTitle}
          </Text>
          <Text variant="body" style={styles.modalSubtitle}>
            {resolvedSubtitle}
          </Text>

          {/* Safety Reassurance Card */}
          <Card variant="outlined" padding="sm" style={styles.reassuranceCard}>
            <View style={styles.reassuranceRow}>
              <Feather name="shield" size={16} color={theme.colors.semantic.success.main} />
              <Text variant="caption" style={styles.reassuranceText}>
                All existing batches, students, attendance, and past test records remain 100% safe.
              </Text>
            </View>
          </Card>

          {/* What unlocks on renew */}
          <View style={styles.featuresBox}>
            <Text variant="caption" style={styles.featuresHeading}>
              UNLOCKED WITH EDUFLOW PRO:
            </Text>
            <View style={styles.featureItem}>
              <Feather name="check" size={14} color={theme.colors.primary.main} />
              <Text variant="caption" style={styles.featureText}>
                Take & modify student attendance
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check" size={14} color={theme.colors.primary.main} />
              <Text variant="caption" style={styles.featureText}>
                Create homework & review student submissions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check" size={14} color={theme.colors.primary.main} />
              <Text variant="caption" style={styles.featureText}>
                Conduct tests & record student marks
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check" size={14} color={theme.colors.primary.main} />
              <Text variant="caption" style={styles.featureText}>
                Add students, upload study notes & log fees
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            <Button
              title="View Plans & Renew Access"
              variant="primary"
              size="lg"
              onPress={handleRenew}
              style={styles.renewButton}
            />
            <Button
              title="Maybe Later"
              variant="ghost"
              size="md"
              onPress={onClose}
              style={styles.cancelButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  reassuranceCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    lineHeight: 16,
  },
  featuresBox: {
    width: '100%',
    backgroundColor: theme.colors.background.screen,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  featuresHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  buttonStack: {
    width: '100%',
    gap: 6,
  },
  renewButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});
