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
import { StudentService } from '@/services/student.service';
import type { Profile } from '@/types/profile';
import type { StudentSession } from '@/types/student';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  studentSession: StudentSession | null;
  profile: Profile | null;
  isLoading: boolean;
  loginWithStudentCode: (code: string) => Promise<{ success: boolean; session?: StudentSession; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeUserIdRef = useRef<string | null>(null);

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

        const currentUser = currentSession?.user ?? null;
        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          activeUserIdRef.current = currentUser.id;
          try {
            const currentProfile = await profileService.getCurrentProfile();
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
          // Check for active local passwordless student session
          const activeStudent = await StudentService.getActiveSession();
          if (activeStudent && mounted) {
            setStudentSession(activeStudent);
            activeUserIdRef.current = activeStudent.studentId;
            setProfile({
              id: activeStudent.studentId,
              role: 'student',
              full_name: activeStudent.name,
              email: activeStudent.email,
              phone: activeStudent.parentPhone,
              institute_name: activeStudent.batchName,
              created_at: activeStudent.joinedAt,
              updated_at: activeStudent.joinedAt,
            });
          } else if (mounted) {
            activeUserIdRef.current = null;
            setProfile(null);
            setStudentSession(null);
          }
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
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) {
        return;
      }

      const newUser = newSession?.user ?? null;

      // When signed out or no session exists
      if (event === 'SIGNED_OUT' || !newSession || !newUser) {
        const activeStudent = await StudentService.getActiveSession();
        if (activeStudent && mounted) {
          setStudentSession(activeStudent);
          activeUserIdRef.current = activeStudent.studentId;
          setProfile({
            id: activeStudent.studentId,
            role: 'student',
            full_name: activeStudent.name,
            email: activeStudent.email,
            phone: activeStudent.parentPhone,
            institute_name: activeStudent.batchName,
            created_at: activeStudent.joinedAt,
            updated_at: activeStudent.joinedAt,
          });
          setIsLoading(false);
          return;
        }

        activeUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setStudentSession(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newUser);
      setStudentSession(null);

      // On TOKEN_REFRESHED, if active user ID has not changed, avoid re-fetching profile
      if (event === 'TOKEN_REFRESHED' && activeUserIdRef.current === newUser.id) {
        setIsLoading(false);
        return;
      }

      // Fetch or update profile if user changed
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

  const loginWithStudentCode = async (code: string) => {
    const res = await StudentService.verifyAndLoginWithInvite(code);
    if (res.success && res.session) {
      setStudentSession(res.session);
      activeUserIdRef.current = res.session.studentId;
      setProfile({
        id: res.session.studentId,
        role: 'student',
        full_name: res.session.name,
        email: res.session.email,
        phone: res.session.parentPhone,
        institute_name: res.session.batchName,
        created_at: res.session.joinedAt,
        updated_at: res.session.joinedAt,
      });
    }
    return res;
  };

  const signOut = async () => {
    activeUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setStudentSession(null);
    setProfile(null);

    await StudentService.clearActiveSession();

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut notice:', err);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    const targetId = activeUserIdRef.current || profile?.id || user?.id || '';
    const updated = await profileService.updateProfile(targetId, updates);
    setProfile(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        studentSession,
        profile,
        isLoading,
        loginWithStudentCode,
        signOut,
        updateProfile,
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