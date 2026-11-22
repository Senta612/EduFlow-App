import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const LOCAL_PUSH_TOKEN_KEY = '@eduflow_device_push_token';
const CACHED_STUDENT_TOKENS_PREFIX = '@eduflow_cached_push_tokens_';

export interface DevicePushTokenRecord {
  id?: string;
  studentId?: string;
  batchId?: string;
  userId?: string;
  role: 'parent' | 'student' | 'teacher';
  pushToken: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
}

class PushTokenService {
  /**
   * Safely obtain the Expo Push Token for the current device
   */
  async getDevicePushToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const Notifications = require('expo-notifications');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );

      const token = tokenData?.data || null;
      if (token) {
        await AsyncStorage.setItem(LOCAL_PUSH_TOKEN_KEY, token);
      }
      return token;
    } catch (e: any) {
      console.warn('[PushTokenService] Failed to get Expo push token:', e?.message || e);
      // Fallback to locally saved token if available
      return AsyncStorage.getItem(LOCAL_PUSH_TOKEN_KEY);
    }
  }

  /**
   * Register device push token for a student or parent account
   */
  async registerStudentDevice(params: {
    studentId: string;
    batchId: string;
    role?: 'parent' | 'student';
  }): Promise<boolean> {
    const token = await this.getDevicePushToken();
    if (!token) return false;

    const record: DevicePushTokenRecord = {
      studentId: params.studentId,
      batchId: params.batchId,
      role: params.role || 'parent',
      pushToken: token,
      platform: Platform.OS as 'android' | 'ios' | 'web',
    };

    try {
      // 1. Save to Supabase device_push_tokens table
      const { error } = await (supabase as any).from('device_push_tokens').upsert(
        {
          student_id: record.studentId,
          batch_id: record.batchId,
          role: record.role,
          push_token: record.pushToken,
          device_platform: record.platform,
          is_active: true,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,push_token' },
      );

      if (error) {
        console.warn('[PushTokenService] Supabase token register error:', error.message);
      }
    } catch (e) {
      console.warn('[PushTokenService] Failed to upsert token to Supabase:', e);
    }

    // Cache locally for offline lookups
    try {
      const cacheKey = `${CACHED_STUDENT_TOKENS_PREFIX}${params.studentId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify([token]));
    } catch {}

    return true;
  }

  /**
   * Retrieve push tokens for a set of student IDs (parents & students)
   */
  async getTokensForStudents(studentIds: string[]): Promise<string[]> {
    if (!studentIds || studentIds.length === 0) return [];

    try {
      const { data, error } = await (supabase as any)
        .from('device_push_tokens')
        .select('push_token')
        .in('student_id', studentIds)
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return Array.from(new Set(data.map((d: any) => d.push_token)));
      }
    } catch (e) {
      console.warn('[PushTokenService] Supabase fetch tokens error:', e);
    }

    // Local fallback for offline mode
    const tokens: string[] = [];
    for (const sid of studentIds) {
      try {
        const raw = await AsyncStorage.getItem(`${CACHED_STUDENT_TOKENS_PREFIX}${sid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) tokens.push(...parsed);
        }
      } catch {}
    }

    return Array.from(new Set(tokens));
  }

  /**
   * Retrieve all push tokens registered for a specific batch
   */
  async getTokensForBatch(batchId: string): Promise<string[]> {
    if (!batchId) return [];

    try {
      const { data, error } = await (supabase as any)
        .from('device_push_tokens')
        .select('push_token')
        .eq('batch_id', batchId)
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return Array.from(new Set(data.map((d: any) => d.push_token)));
      }
    } catch (e) {
      console.warn('[PushTokenService] Supabase fetch batch tokens error:', e);
    }

    return [];
  }
}

export const pushTokenService = new PushTokenService();
