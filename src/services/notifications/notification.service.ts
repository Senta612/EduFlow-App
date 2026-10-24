import { Alert, Platform } from 'react-native';
import { STORAGE_KEYS, getStored, setStored } from '../teacher/storage.keys';
import { Batch } from '@/types/teacher';

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

const SCHEDULED_NOTIFS_STORAGE_KEY = '@eduflow_scheduled_notification_ids';

// Safe dynamic lazy-loader for expo-notifications
// Senior Pattern: Bridges Expo SDK 53+ Expo Go Android incompatibility where ExpoTopicSubscriptionModule
// was removed for remote push, while preserving full local notification functionality.
let cachedNotificationsModule: typeof import('expo-notifications') | null = null;
let hasCheckedNativeModule = false;

function ensureTopicSubscriptionPolyfill(): void {
  if (Platform.OS !== 'android') return;

  try {
    const g = globalThis as any;
    if (!g.expo) g.expo = {};
    if (!g.expo.modules) g.expo.modules = {};
    if (!g.expo.modules.ExpoTopicSubscriptionModule) {
      g.expo.modules.ExpoTopicSubscriptionModule = {
        addListener: () => {},
        removeListeners: () => {},
        subscribeToTopicAsync: async () => null,
        unsubscribeFromTopicAsync: async () => null,
      };
    }
  } catch {
    // Ignore polyfill registration errors
  }

  try {
    const core = require('expo-modules-core');
    if (core?.NativeModulesProxy && !core.NativeModulesProxy.ExpoTopicSubscriptionModule) {
      core.NativeModulesProxy.ExpoTopicSubscriptionModule = {
        addListener: () => {},
        removeListeners: () => {},
        subscribeToTopicAsync: async () => null,
        unsubscribeFromTopicAsync: async () => null,
      };
    }
  } catch {
    // Ignore polyfill registration errors
  }
}

// Polyfill immediately on module evaluation
ensureTopicSubscriptionPolyfill();

function getNativeNotifications(): typeof import('expo-notifications') | null {
  if (hasCheckedNativeModule) {
    return cachedNotificationsModule;
  }
  hasCheckedNativeModule = true;

  if (Platform.OS === 'web') {
    return null;
  }

  try {
    ensureTopicSubscriptionPolyfill();
    // Dynamic require inside try/catch so missing native modules in Expo Go do not crash the app
    const mod = require('expo-notifications');
    if (mod && typeof mod.setNotificationHandler === 'function') {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      cachedNotificationsModule = mod;
      return mod;
    }
  } catch (err: any) {
    // Expo Go on Android fallback
    console.warn(
      '[EduFlow Notifications] Operating safely in in-app notification mode.',
      err?.message,
    );
    cachedNotificationsModule = null;
  }

  return cachedNotificationsModule;
}

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
   * Initializes notification channels for Android 8.0+ safely
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const native = getNativeNotifications();
    if (!native || Platform.OS !== 'android') return;

    try {
      await native.setNotificationChannelAsync('classes', {
        name: 'Class & Schedule Reminders',
        description: 'Timely reminders before scheduled batches start',
        importance: native.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
      });

      await native.setNotificationChannelAsync('attendance', {
        name: 'Attendance Alerts',
        description: 'Daily reminders to submit student attendance rosters',
        importance: native.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16A34A',
        sound: 'default',
      });

      await native.setNotificationChannelAsync('default', {
        name: 'General Alerts & Updates',
        description: 'Homework, fees, and general alerts',
        importance: native.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    } catch (err) {
      console.warn('Notification channel config note:', err);
    }
  }

  /**
   * Request native system notification permissions (safe in Expo Go, Dev Builds & Web)
   */
  async requestPermissions(): Promise<boolean> {
    const native = getNativeNotifications();
    if (!native) {
      // In Expo Go or Web where native module is unavailable, treat permissions as granted for in-app inbox
      return true;
    }

    try {
      await this.init();
      const { status: existingStatus } = await native.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await native.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Notification permission request error:', e);
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
   * Triggers an immediate local OS notification if available, and records it in in-app inbox
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

    const native = getNativeNotifications();
    if (native) {
      try {
        await native.scheduleNotificationAsync({
          content: {
            title: params.title,
            body: params.body,
            data: { ...params.data, notificationId: saved.id, type: params.type },
            sound: true,
          },
          trigger: null,
        });
      } catch (err) {
        console.warn('Native notification presentation warning:', err);
      }
    }

    if (params.showAlertModal || !native) {
      // In Expo Go or Web, show quick Alert feedback
      Alert.alert(params.title, params.body);
    }

    return saved.id;
  }

  /**
   * Schedules a recurring OS reminder 15 minutes before each class day of a Batch
   */
  async scheduleClassReminder(batch: Batch): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.classReminders) return;

    const native = getNativeNotifications();
    if (!native) return;

    const parsedTime = parseTimeString(batch.timing);
    if (!parsedTime) return;

    let reminderHour = parsedTime.hour;
    let reminderMinute = parsedTime.minute - 15;
    if (reminderMinute < 0) {
      reminderMinute += 60;
      reminderHour = (reminderHour - 1 + 24) % 24;
    }

    const dayTokens = batch.schedule.split(/[,/&|\s]+/);
    const trackedScheduledIds = await getStored<Record<string, string[]>>(
      SCHEDULED_NOTIFS_STORAGE_KEY,
      {},
    );

    if (trackedScheduledIds[batch.id]) {
      for (const id of trackedScheduledIds[batch.id]) {
        try {
          await native.cancelScheduledNotificationAsync(id);
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
        const id = await native.scheduleNotificationAsync({
          content: {
            title: `🔔 Upcoming Class: ${batch.name}`,
            body: `Starts in 15 mins (${batch.timing}) in ${batch.room || 'Room 101'}. Tap to take attendance.`,
            data: { batchId: batch.id, url: `/(teacher)/attendance/${batch.id}`, type: 'class' },
            sound: true,
          },
          trigger: {
            type: native.SchedulableTriggerInputTypes.WEEKLY,
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
   * Schedules a daily attendance reminder at 7:00 PM
   */
  async scheduleDailyAttendanceAlert(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.attendanceAlerts) return;

    const native = getNativeNotifications();
    if (!native) return;

    try {
      const existing = await native.getAllScheduledNotificationsAsync();
      for (const notif of existing) {
        if (notif.content.data?.type === 'daily_attendance_reminder') {
          await native.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      await native.scheduleNotificationAsync({
        content: {
          title: '📋 Daily Attendance Reminder',
          body: 'Have you marked attendance for all of today\'s batches? Tap to check pending rosters.',
          data: { type: 'daily_attendance_reminder', url: '/(teacher)/(tabs)/tasks' },
          sound: true,
        },
        trigger: {
          type: native.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule daily attendance alert:', e);
    }
  }

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

  async cancelAllScheduled(): Promise<void> {
    const native = getNativeNotifications();
    if (!native) return;
    try {
      await native.cancelAllScheduledNotificationsAsync();
      await setStored(SCHEDULED_NOTIFS_STORAGE_KEY, {});
    } catch (e) {
      console.warn('Failed to cancel scheduled notifications:', e);
    }
  }

  /**
   * Sets up deep link listeners for cold start and tap responses safely
   */
  setupResponseListener(onNavigate: (route: string) => void): () => void {
    const native = getNativeNotifications();
    if (!native) {
      return () => {};
    }

    try {
      // 1. Cold start
      const lastResponse = native.getLastNotificationResponse();
      if (lastResponse?.notification) {
        const data = lastResponse.notification.request.content.data;
        if (typeof data?.batchId === 'string') {
          onNavigate(`/(teacher)/attendance/${data.batchId}`);
        } else if (typeof data?.url === 'string') {
          onNavigate(data.url);
        }
      }

      // 2. Runtime response
      const sub = native.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (typeof data?.batchId === 'string') {
          onNavigate(`/(teacher)/attendance/${data.batchId}`);
        } else if (typeof data?.url === 'string') {
          onNavigate(data.url);
        }
      });

      return () => {
        sub.remove();
      };
    } catch {
      return () => {};
    }
  }
}

export const notificationService = new NotificationService();
