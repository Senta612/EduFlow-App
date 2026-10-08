import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  BATCHES: '@eduflow_teacher_batches',
  ATTENDANCE: '@eduflow_teacher_attendance',
  HOMEWORK: '@eduflow_teacher_homework',
  TESTS: '@eduflow_teacher_tests',
  MARKS: '@eduflow_teacher_marks',
  STUDENTS: '@eduflow_teacher_students',
  HW_SUBMISSIONS: '@eduflow_teacher_hw_submissions',
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
