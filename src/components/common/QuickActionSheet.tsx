import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { hapticsService } from '@/services/haptics.service';
import { theme } from '@/theme';

export interface QuickActionItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
  badge?: string;
  onPress: () => void;
}

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions?: QuickActionItem[];
  onTakeAttendance?: () => void;
  onCreateBatch?: () => void;
  onCreateTest?: () => void;
  onAssignHomework?: () => void;
  onCollectFees?: () => void;
  onViewReports?: () => void;
}

export function QuickActionSheet({
  visible,
  onClose,
  actions,
  onTakeAttendance,
  onCreateBatch,
  onCreateTest,
  onAssignHomework,
  onCollectFees,
  onViewReports,
}: QuickActionSheetProps) {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    hapticsService.light();
    onClose();
  };

  const handleActionPress = (action: () => void) => {
    hapticsService.selection();
    onClose();
    // Allow sheet animation to start before firing navigation
    setTimeout(() => {
      action();
    }, 150);
  };

  const defaultActions: QuickActionItem[] = [
    ...(onTakeAttendance
      ? [
          {
            id: 'attendance',
            icon: 'check-square' as keyof typeof Feather.glyphMap,
            title: 'Take Attendance',
            description: 'Fast 1-tap attendance marking with native haptic feedback',
            iconColor: '#2563EB',
            iconBgColor: '#EFF6FF',
            badge: 'Haptic Ready',
            onPress: onTakeAttendance,
          },
        ]
      : []),
    ...(onCreateBatch
      ? [
          {
            id: 'batch',
            icon: 'layers' as keyof typeof Feather.glyphMap,
            title: 'Create New Batch',
            description: 'Set schedule, subject, fees & capacity limit',
            iconColor: '#7C3AED',
            iconBgColor: '#F5F3FF',
            onPress: onCreateBatch,
          },
        ]
      : []),
    ...(onCreateTest
      ? [
          {
            id: 'test',
            icon: 'award' as keyof typeof Feather.glyphMap,
            title: 'Create Test & Enter Marks',
            description: 'Schedule tests, track toppers & grade answer sheets',
            iconColor: '#D97706',
            iconBgColor: '#FEF3C7',
            onPress: onCreateTest,
          },
        ]
      : []),
    ...(onAssignHomework
      ? [
          {
            id: 'homework',
            icon: 'book-open' as keyof typeof Feather.glyphMap,
            title: 'Assign Homework',
            description: 'Publish assignments with instructions & deadlines',
            iconColor: '#059669',
            iconBgColor: '#ECFDF5',
            onPress: onAssignHomework,
          },
        ]
      : []),
    ...(onCollectFees
      ? [
          {
            id: 'fees',
            icon: 'message-circle' as keyof typeof Feather.glyphMap,
            title: 'Fee Collection & WhatsApp',
            description: 'Send 1-tap personalized payment slips to parents',
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            badge: '1-Tap Slip',
            onPress: onCollectFees,
          },
        ]
      : []),
    ...(onViewReports
      ? [
          {
            id: 'reports',
            icon: 'bar-chart-2' as keyof typeof Feather.glyphMap,
            title: 'Analytics & Reports',
            description: 'View student progress rings and performance trends',
            iconColor: '#4F46E5',
            iconBgColor: '#EEF2FF',
            onPress: onViewReports,
          },
        ]
      : []),
  ];

  const items = actions || defaultActions;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close Speed Menu"
        />
        <SafeAreaView
          edges={['bottom']}
          style={styles.safeArea}
          pointerEvents="box-none"
        >
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Grab Handle */}
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.speedIconBox}>
                  <Feather name="zap" size={18} color="#2563EB" />
                </View>
                <View>
                  <View style={styles.headerTitleRow}>
                    <Text variant="title" style={styles.headerTitle}>
                      Quick Actions
                    </Text>
                    <View style={styles.speedBadge}>
                      <Text variant="caption" style={styles.speedBadgeText}>
                        Speed Menu
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" style={styles.headerSubtitle}>
                    Instant 1-tap shortcuts for daily tuition workflow
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {/* Actions List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.actionsList}
            >
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed && styles.actionCardPressed,
                  ]}
                  onPress={() => handleActionPress(item.onPress)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      { backgroundColor: item.iconBgColor },
                    ]}
                  >
                    <Feather name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <View style={styles.actionTitleRow}>
                      <Text variant="label" style={styles.actionTitle}>
                        {item.title}
                      </Text>
                      {item.badge && (
                        <View style={styles.actionBadge}>
                          <Text variant="caption" style={styles.actionBadgeText}>
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text variant="caption" style={styles.actionDesc}>
                      {item.description}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={theme.colors.text.disabled}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

interface SpeedActionFloatingButtonProps {
  onPress: () => void;
  style?: object;
}

export function SpeedActionFloatingButton({
  onPress,
  style,
}: SpeedActionFloatingButtonProps) {
  const handlePress = () => {
    hapticsService.light();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.floatingButton,
        pressed && styles.floatingButtonPressed,
        style,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Open Quick Speed Menu"
    >
      <Feather name="plus" size={26} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.border.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  speedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  speedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  speedBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.background.main,
  },
  actionsList: {
    paddingVertical: 8,
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.main,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    gap: 14,
  },
  actionCardPressed: {
    backgroundColor: theme.colors.border.light,
    transform: [{ scale: 0.99 }],
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  actionBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  actionDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  floatingButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  floatingButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
});
