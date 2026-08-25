import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

export const profileService = {
  async getCurrentProfile(): Promise<Profile> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('No authenticated user found.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  },
};