import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/profile';

const PROFILE_STORAGE_PREFIX = '@eduflow_custom_profile_';

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    let baseProfile: Profile | null = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        baseProfile = data as Profile;
      } else {
        const metaRole = (user.user_metadata?.role as UserRole) || 'teacher';
        const fullName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
        
        // Create initial profile record if none exists yet
        const newProfile: Profile = {
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: metaRole,
          phone: null,
          institute_name: null,
          specialization: null,
          qualifications: null,
          bio: null,
          created_at: user.created_at,
          updated_at: user.created_at,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: metaRole,
          })
          .select()
          .maybeSingle();

        baseProfile = (!insertError && inserted) ? (inserted as Profile) : newProfile;
      }
    } catch (e) {
      console.warn('Profile fetch warning:', e);
    }

    if (!baseProfile) {
      const metaRole = (user.user_metadata?.role as UserRole) || 'teacher';
      baseProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
        role: metaRole,
        phone: null,
        institute_name: null,
        specialization: null,
        qualifications: null,
        bio: null,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.created_at || new Date().toISOString(),
      };
    }

    // Check for locally saved profile customizations as offline fallback
    try {
      const stored = await AsyncStorage.getItem(`${PROFILE_STORAGE_PREFIX}${baseProfile.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        baseProfile = {
          ...baseProfile,
          ...parsed,
        };
      }
    } catch {
      // ignore storage read error
    }

    return baseProfile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const current = (await this.getCurrentProfile()) || {
      id: userId,
      full_name: 'User',
      role: 'teacher' as UserRole,
      phone: null,
      institute_name: null,
      specialization: null,
      qualifications: null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProfile: Profile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Save locally
    try {
      await AsyncStorage.setItem(
        `${PROFILE_STORAGE_PREFIX}${userId}`,
        JSON.stringify(updatedProfile),
      );
    } catch (e) {
      console.warn('Failed to save profile to AsyncStorage:', e);
    }

    // Remote save to Supabase
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
          institute_name: updatedProfile.institute_name,
          specialization: updatedProfile.specialization,
          qualifications: updatedProfile.qualifications,
          bio: updatedProfile.bio,
          updated_at: updatedProfile.updated_at,
        });
    } catch (e) {
      console.warn('Failed to sync profile update to Supabase:', e);
    }

    return updatedProfile;
  },
};