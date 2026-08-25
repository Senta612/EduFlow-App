import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
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

  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) {
        return;
      }

      const newUser = newSession?.user ?? null;

      // When signed out or no session exists
      if (event === 'SIGNED_OUT' || !newSession || !newUser) {
        activeUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newUser);

      // On TOKEN_REFRESHED, if active user ID has not changed, avoid re-fetching profile
      if (event === 'TOKEN_REFRESHED' && activeUserIdRef.current === newUser.id) {
        setIsLoading(false);
        return;
      }

      // Fetch or update profile if user changed or profile is not yet loaded
      if (activeUserIdRef.current !== newUser.id) {
        try {
          const currentProfile = await profileService.getCurrentProfile();
          if (mounted) {
            activeUserIdRef.current = newUser.id;
            setProfile(currentProfile);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          if (mounted) {
            setProfile(null);
          }
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Synchronously clear local state for instant user feedback
    activeUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
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