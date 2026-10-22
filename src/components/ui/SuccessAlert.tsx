import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { FeeStatusBadge } from '@/components/ui/FeeStatusBadge';
import { FeeStatus } from '@/types/teacher';
import { theme } from '@/theme';

export type SuccessAlertVariant = 'success' | 'purple' | 'primary' | 'warning' | 'info';

export interface SuccessAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: SuccessAlertVariant;
  icon?: keyof typeof Feather.glyphMap;
  feeStatus?: FeeStatus;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface VariantColorConfig {
  main: string;
  bg: string;
  halo: string;
  border: string;
  bar: string;
  defaultIcon: keyof typeof Feather.glyphMap;
}

const VARIANT_CONFIGS: Record<SuccessAlertVariant, VariantColorConfig> = {
  success: {
    main: '#15803D',
    bg: '#DCFCE7',
    halo: 'rgba(22, 163, 74, 0.14)',
    border: '#86EFAC',
    bar: '#16A34A',
    defaultIcon: 'check-circle',
  },
  purple: {
    main: '#6D28D9',
    bg: '#EDE9FE',
    halo: 'rgba(124, 58, 237, 0.14)',
    border: '#C4B5FD',
    bar: '#7C3AED',
    defaultIcon: 'award',
  },
  primary: {
    main: '#1D4ED8',
    bg: '#EFF6FF',
    halo: 'rgba(37, 99, 235, 0.14)',
    border: '#93C5FD',
    bar: '#2563EB',
    defaultIcon: 'check-circle',
  },
  warning: {
    main: '#B45309',
    bg: '#FEF3C7',
    halo: 'rgba(217, 119, 6, 0.14)',
    border: '#FCD34D',
    bar: '#D97706',
    defaultIcon: 'clock',
  },
  info: {
    main: '#0369A1',
    bg: '#E0F2FE',
    halo: 'rgba(2, 132, 199, 0.14)',
    border: '#7DD3FC',
    bar: '#0284C7',
    defaultIcon: 'info',
  },
};

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
  visible,
  onClose,
  title,
  message,
  variant = 'success',
  icon,
  feeStatus,
  duration = 3400,
  actionLabel,
  onAction,
}) => {
  const insets = useSafeAreaInsets();
  const timerProgress = useSharedValue(1);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.success;
  const displayIcon = icon || config.defaultIcon;

  useEffect(() => {
    if (visible) {
      timerProgress.value = 1;
      timerProgress.value = withTiming(0, {
        duration,
        easing: Easing.linear,
      });

      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    } else {
      timerProgress.value = 1;
    }
  }, [visible, duration, timerProgress]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(140).mass(0.8)}
      exiting={FadeOutUp.duration(180)}
      style={[
        styles.overlayContainer,
        {
          top: Math.max(insets.top + 8, Platform.OS === 'ios' ? 48 : 24),
        },
      ]}
    >
      <Pressable
        style={[
          styles.alertCard,
          {
            borderColor: config.border,
          },
        ]}
        onPress={onClose}
        accessibilityRole="alert"
        accessibilityLabel={`${title}. ${message || ''}`}
      >
        {/* Left Vertical Accent Line */}
        <View style={[styles.leftAccentBar, { backgroundColor: config.bar }]} />

        <View style={styles.cardContent}>
          {/* Glowing Dual-Ring Icon */}
          <View style={[styles.iconHalo, { backgroundColor: config.halo }]}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: config.bg, borderColor: config.border },
              ]}
            >
              <Feather name={displayIcon} size={18} color={config.main} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text variant="label" style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
              {feeStatus && (
                <FeeStatusBadge status={feeStatus} size="sm" />
              )}
            </View>
            {message ? (
              <Text variant="caption" style={styles.messageText} numberOfLines={2}>
                {message}
              </Text>
            ) : null}
          </View>

          {/* Action or Close Button */}
          {actionLabel && onAction ? (
            <Pressable
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: config.bg }]}
              onPress={(e) => {
                e.stopPropagation();
                onAction();
              }}
            >
              <Text variant="caption" style={[styles.actionBtnText, { color: config.main }]}>
                {actionLabel}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={10}
              style={styles.closeBtn}
              onPress={(e) => {
                e.stopPropagation();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss alert"
            >
              <Feather name="x" size={15} color={theme.colors.text.secondary} />
            </Pressable>
          )}
        </View>

        {/* Dynamic Progress Timer Strip */}
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              { backgroundColor: config.bar },
              animatedProgressStyle,
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  alertCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  messageText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  timerTrack: {
    height: 3,
    backgroundColor: '#F1F5F9',
    width: '100%',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
