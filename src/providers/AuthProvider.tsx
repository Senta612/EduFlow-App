import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '@/lib/supabase';
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

    const initializeAuth = async () => {
      try {
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
            console.log('Error details:', error);

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
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
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