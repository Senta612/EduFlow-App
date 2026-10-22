import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  BATCHES: '@eduflow_teacher_batches',
  ATTENDANCE: '@eduflow_teacher_attendance',
  HOMEWORK: '@eduflow_teacher_homework',
  TESTS: '@eduflow_teacher_tests',
  MARKS: '@eduflow_teacher_marks',
  STUDENTS: '@eduflow_teacher_students',
  HW_SUBMISSIONS: '@eduflow_teacher_hw_submissions',
  MATERIALS: '@eduflow_teacher_study_materials',
  FEE_STATUS_ENABLED: '@eduflow_teacher_fee_status_enabled',
  FEES: '@eduflow_teacher_fee_payments',
  FEE_CONFIGS: '@eduflow_teacher_batch_fee_configs',
  NOTIFICATIONS: '@eduflow_teacher_notifications',
  NOTIFICATION_SETTINGS: '@eduflow_teacher_notification_settings',
} as const;

export async function getStored<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStored<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Storage write error for key "${key}":`, e);
  }
}
