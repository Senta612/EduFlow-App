import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Senior Developer Pattern: Centralized Haptics Service
 * Safely wraps native vibration feedback with web and emulator fail-safes.
 */
class HapticsService {
  /**
   * Subtle tick for quick selection toggles (e.g., student marked Present)
   */
  async light(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored on unsupported devices/emulators
    }
  }

  /**
   * Prominent bump for negative or state-changing actions (e.g., student marked Absent)
   */
  async medium(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignored
    }
  }

  /**
   * Solid physical impact for major bulk operations (e.g., "Mark All Present", "Delete Batch")
   */
  async heavy(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignored
    }
  }

  /**
   * Gentle selection click (e.g. date picker wheel, segment switcher tab)
   */
  async selection(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignored
    }
  }

  /**
   * Success notification pulse (e.g. Attendance Submitted, Marks Published, Sync Done)
   */
  async success(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored
    }
  }

  /**
   * Warning vibration (e.g. Unscheduling, Low Attendance warning)
   */
  async warning(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignored
    }
  }

  /**
   * Error pulse (e.g. Validation failure, Submission error)
   */
  async error(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignored
    }
  }
}

export const hapticFeedback = new HapticsService();
