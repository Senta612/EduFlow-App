import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types/profile';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export const MOCK_USERS: MockUser[] = [];

const MOCK_AUTH_STORAGE_KEY = '@eduflow_mock_auth_user';

type AuthListener = (user: MockUser | null) => void;
const listeners = new Set<AuthListener>();

export function findMockUser(email: string, password?: string): MockUser | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  return MOCK_USERS.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      (password === undefined || u.password === password),
  );
}

export async function getStoredMockUser(): Promise<MockUser | null> {
  try {
    const raw = await AsyncStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export async function setStoredMockUser(user: MockUser): Promise<void> {
  await AsyncStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
  listeners.forEach((listener) => listener(user));
}

export async function removeStoredMockUser(): Promise<void> {
  await AsyncStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  listeners.forEach((listener) => listener(null));
}

export function subscribeMockAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function createMockSupabaseUser(mockUser: MockUser): User {
  return {
    id: mockUser.id,
    app_metadata: { provider: 'email' },
    user_metadata: {
      full_name: mockUser.full_name,
      role: mockUser.role,
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: mockUser.email,
    email_confirmed_at: new Date().toISOString(),
    factors: [],
    identities: [],
    is_anonymous: false,
    last_sign_in_at: new Date().toISOString(),
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

export function createMockSession(mockUser: MockUser): Session {
  const user = createMockSupabaseUser(mockUser);
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
}

export function createMockProfile(mockUser: MockUser): Profile {
  return {
    id: mockUser.id,
    full_name: mockUser.full_name,
    role: mockUser.role,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
