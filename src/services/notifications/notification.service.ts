import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { STORAGE_KEYS, getStored, setStored } from '../teacher/storage.keys';
import { Batch } from '@/types/teacher';

// Senior Pattern: Configure foreground notification presentation at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType = 'class' | 'attendance' | 'homework' | 'fee' | 'system';

export interface AppNotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationSettingsState {
  classReminders: boolean;
  attendanceAlerts: boolean;
  homeworkNotifs: boolean;
  feeReminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettingsState = {
  classReminders: true,
  attendanceAlerts: true,
  homeworkNotifs: true,
  feeReminders: true,
};

// Storage key to track OS scheduled notification IDs (for batch and attendance reminders)
const SCHEDULED_NOTIFS_STORAGE_KEY = '@eduflow_scheduled_notification_ids';

/**
 * Parses time strings like "04:00 PM" or "10:30 AM" into 24-hr hour and minute
 */
function parseTimeString(timeStr: string): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hour < 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

/**
 * Maps day abbreviations (Mon, Tue, etc.) to 1-indexed weekday (Sunday = 1, Monday = 2, ...)
 */
function mapDayToWeekday(dayStr: string): number | null {
  const normalized = dayStr.trim().toLowerCase();
  if (normalized.startsWith('sun')) return 1;
  if (normalized.startsWith('mon')) return 2;
  if (normalized.startsWith('tue')) return 3;
  if (normalized.startsWith('wed')) return 4;
  if (normalized.startsWith('thu')) return 5;
  if (normalized.startsWith('fri')) return 6;
  if (normalized.startsWith('sat')) return 7;
  return null;
}

export class NotificationService {
  private isInitialized = false;

  /**
   * Initializes notification channels for Android 8.0+
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('classes', {
          name: 'Class & Schedule Reminders',
          description: 'Timely reminders before scheduled batches start',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('attendance', {
          name: 'Attendance Alerts',
          description: 'Daily reminders to submit student attendance rosters',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16A34A',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('default', {
          name: 'General Alerts & Updates',
          description: 'Homework, fees, and general alerts',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      } catch (err) {
        console.warn('Failed to configure Android notification channels:', err);
      }
    }
  }

  /**
   * Request native system notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      await this.init();
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Notification permission request error:', e);
      return false;
    }
  }

  /**
   * Check if notification permission is currently granted
   */
  async hasPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async getSettings(): Promise<NotificationSettingsState> {
    return getStored<NotificationSettingsState>(
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      DEFAULT_SETTINGS,
    );
  }

  async saveSettings(settings: Partial<NotificationSettingsState>): Promise<NotificationSettingsState> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await setStored(STORAGE_KEYS.NOTIFICATION_SETTINGS, updated);
    return updated;
  }

  async getNotifications(): Promise<AppNotificationItem[]> {
    const items = await getStored<AppNotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addNotificationToHistory(item: Omit<AppNotificationItem, 'id' | 'timestamp' | 'read'>): Promise<AppNotificationItem> {
    const list = await getStored<AppNotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newItem: AppNotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      body: item.body,
      type: item.type,
      timestamp: new Date().toISOString(),
      read: false,
      data: item.data,
    };

    const updated = [newItem, ...list.slice(0, 99)]; // Keep latest 100
    await setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newItem;
  }

  async markAsRead(id: string): Promise<void> {
    const list = await getStored<AppNotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map((item) => (item.id === id ? { ...item, read: true } : item));
    await setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  async markAllAsRead(): Promise<void> {
    const list = await getStored<AppNotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map((item) => ({ ...item, read: true }));
    await setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  async clearAll(): Promise<void> {
    await setStored(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  /**
   * Triggers an immediate local OS notification and records it in the in-app history.
   * Works on lock-screen and notification center.
   */
  async triggerLocalNotification(params: {
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
    showAlertModal?: boolean;
  }): Promise<string> {
    await this.init();
    const saved = await this.addNotificationToHistory(params);

    if (Platform.OS !== 'web') {
      try {
        const channelId =
          params.type === 'class'
            ? 'classes'
            : params.type === 'attendance'
            ? 'attendance'
            : 'default';

        await Notifications.scheduleNotificationAsync({
          content: {
            title: params.title,
            body: params.body,
            data: { ...params.data, notificationId: saved.id, type: params.type },
            sound: true,
          },
          trigger: null, // null trigger presents notification immediately
        });
      } catch (err) {
        console.warn('Native notification presentation warning:', err);
      }
    }

    if (params.showAlertModal && Platform.OS === 'web') {
      Alert.alert(params.title, params.body);
    }

    return saved.id;
  }

  /**
   * Schedules a recurring OS reminder 15 minutes before each class day of a Batch
   */
  async scheduleClassReminder(batch: Batch): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.classReminders || Platform.OS === 'web') return;

    const parsedTime = parseTimeString(batch.timing);
    if (!parsedTime) return;

    // Calculate 15 minutes prior
    let reminderHour = parsedTime.hour;
    let reminderMinute = parsedTime.minute - 15;
    if (reminderMinute < 0) {
      reminderMinute += 60;
      reminderHour = (reminderHour - 1 + 24) % 24;
    }

    // Days list from batch schedule (e.g. "Mon, Wed, Fri")
    const dayTokens = batch.schedule.split(/[,/&|\s]+/);
    const trackedScheduledIds = await getStored<Record<string, string[]>>(
      SCHEDULED_NOTIFS_STORAGE_KEY,
      {},
    );

    // Cancel any previous scheduled notifications for this batch first
    if (trackedScheduledIds[batch.id]) {
      for (const id of trackedScheduledIds[batch.id]) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          // ignore
        }
      }
    }

    const newIds: string[] = [];

    for (const token of dayTokens) {
      const weekday = mapDayToWeekday(token);
      if (!weekday) continue;

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 Upcoming Class: ${batch.name}`,
            body: `Starts in 15 mins (${batch.timing}) in ${batch.room || 'Room 101'}. Tap to take attendance.`,
            data: { batchId: batch.id, url: `/(teacher)/attendance/${batch.id}`, type: 'class' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: reminderHour,
            minute: reminderMinute,
          },
        });
        newIds.push(id);
      } catch (e) {
        console.warn(`Failed to schedule reminder for batch ${batch.name} on day ${token}:`, e);
      }
    }

    trackedScheduledIds[batch.id] = newIds;
    await setStored(SCHEDULED_NOTIFS_STORAGE_KEY, trackedScheduledIds);
  }

  /**
   * Schedules a daily attendance reminder at 7:00 PM if attendance is pending
   */
  async scheduleDailyAttendanceAlert(): Promise<void> {
    if (Platform.OS === 'web') return;

    const settings = await this.getSettings();
    if (!settings.attendanceAlerts) return;

    try {
      // Look for and clear existing daily attendance reminder
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of existing) {
        if (notif.content.data?.type === 'daily_attendance_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Daily Attendance Reminder',
          body: 'Have you marked attendance for all of today\'s batches? Tap to check pending rosters.',
          data: { type: 'daily_attendance_reminder', url: '/(teacher)/(tabs)/tasks' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19, // 7:00 PM
          minute: 0,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule daily attendance alert:', e);
    }
  }

  /**
   * Immediate attendance reminder alert
   */
  async triggerAttendanceAlert(unmarkedBatchesCount: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.attendanceAlerts || unmarkedBatchesCount <= 0) return;

    await this.triggerLocalNotification({
      title: `📋 Attendance Reminder`,
      body: `You have ${unmarkedBatchesCount} batch${unmarkedBatchesCount > 1 ? 'es' : ''} waiting for attendance today.`,
      type: 'attendance',
      data: { url: '/(teacher)/(tabs)/tasks' },
    });
  }

  /**
   * Immediate fee due alert
   */
  async triggerFeeAlert(pendingCount: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.feeReminders || pendingCount <= 0) return;

    await this.triggerLocalNotification({
      title: `💰 Monthly Fee Follow-up`,
      body: `${pendingCount} student${pendingCount > 1 ? 's have' : ' has'} pending tuition fees. Send 1-tap WhatsApp reminders.`,
      type: 'fee',
      data: { url: '/(teacher)/more/fees' },
    });
  }

  /**
   * Cancels all scheduled OS notifications (e.g. on logout or settings reset)
   */
  async cancelAllScheduled(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await setStored(SCHEDULED_NOTIFS_STORAGE_KEY, {});
    } catch (e) {
      console.warn('Failed to cancel scheduled notifications:', e);
    }
  }
}

export const notificationService = new NotificationService();
