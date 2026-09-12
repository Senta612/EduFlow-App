import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import {
  createMockProfile,
  createMockSession,
  createMockSupabaseUser,
  getStoredMockUser,
  removeStoredMockUser,
  subscribeMockAuth,
} from '@/services/mockAuth';
import { profileService } from '@/services/profile.service';
import type { Profile } from '@/types/profile';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Listen to mock auth changes
    const unsubscribeMock = subscribeMockAuth((mockUser) => {
      if (!mounted) return;
      if (mockUser) {
        setUser(createMockSupabaseUser(mockUser));
        setSession(createMockSession(mockUser));
        setProfile(createMockProfile(mockUser));
        setIsLoading(false);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    const initializeAuth = async () => {
      try {
        // 1. Check for stored mock user first
        const storedMockUser = await getStoredMockUser();
        if (storedMockUser && mounted) {
          setUser(createMockSupabaseUser(storedMockUser));
          setSession(createMockSession(storedMockUser));
          setProfile(createMockProfile(storedMockUser));
          setIsLoading(false);
          return;
        }

        // 2. Check Supabase session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          try {
            const currentProfile =
              await profileService.getCurrentProfile();

            if (mounted) {
              setProfile(currentProfile);
            }
          } catch (error) {
            console.error('Failed to load profile:', error);

            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) {
          return;
        }

        // If mock user is currently active, don't overwrite with null supabase session
        const storedMockUser = await getStoredMockUser();
        if (storedMockUser) {
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          try {
            const currentProfile =
              await profileService.getCurrentProfile();

            if (mounted) {
              setProfile(currentProfile);
            }
          } catch (error) {
            console.error('Failed to load profile:', error);

            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      unsubscribeMock();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await removeStoredMockUser();
    setUser(null);
    setSession(null);
    setProfile(null);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase signOut notice:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}