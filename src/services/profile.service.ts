import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/profile';

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      return data as Profile;
    }

    // Safe Fallback: If public.profiles database row is missing (e.g. database trigger
    // was not set up on auth.users), construct a profile from user.user_metadata so
    // the user is not locked out of the application.
    const metaRole = user.user_metadata?.role;
    if (metaRole === 'teacher' || metaRole === 'student') {
      return {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? 'User',
        role: metaRole as UserRole,
        phone: null,
        created_at: user.created_at,
        updated_at: user.created_at,
      };
    }

    return null;
  },
};