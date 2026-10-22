import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { STORAGE_KEYS, getStored, setStored } from '../teacher/storage.keys';
import { Batch } from '@/types/teacher';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

export class NotificationService {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'EduFlow Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
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
   * Triggers an immediate local push notification and saves it to history
   */
  async triggerLocalNotification(params: {
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
  }): Promise<string | null> {
    await this.init();
    await this.addNotificationToHistory(params);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: { type: params.type, ...params.data },
          sound: true,
        },
        trigger: null, // immediate
      });
      return id;
    } catch (e) {
      console.warn('Failed to dispatch notification:', e);
      return null;
    }
  }

  /**
   * Schedule class reminder for an upcoming batch
   */
  async scheduleClassReminder(batch: Batch, secondsBefore: number = 900): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.classReminders) return;

    await this.triggerLocalNotification({
      title: `🔔 Upcoming Class: ${batch.name}`,
      body: `Class starts at ${batch.timing}. Room: ${batch.room || 'Main Hall'}. Tap to review roster.`,
      type: 'class',
      data: { batchId: batch.id },
    });
  }

  /**
   * Send daily attendance reminder if not yet taken
   */
  async triggerAttendanceAlert(unmarkedBatchesCount: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.attendanceAlerts || unmarkedBatchesCount <= 0) return;

    await this.triggerLocalNotification({
      title: `📋 Attendance Reminder`,
      body: `You have ${unmarkedBatchesCount} batch${unmarkedBatchesCount > 1 ? 'es' : ''} waiting for attendance today.`,
      type: 'attendance',
    });
  }

  /**
   * Send fee due alert
   */
  async triggerFeeAlert(pendingCount: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.feeReminders || pendingCount <= 0) return;

    await this.triggerLocalNotification({
      title: `💰 Monthly Fee Follow-up`,
      body: `${pendingCount} student${pendingCount > 1 ? 's have' : ' has'} pending tuition fees. Send 1-tap reminders.`,
      type: 'fee',
    });
  }
}

export const notificationService = new NotificationService();
