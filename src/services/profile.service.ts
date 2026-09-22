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

    let baseProfile: Profile | null = null;

    if (!userError && user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        baseProfile = data as Profile;
      } else {
        const metaRole = user.user_metadata?.role;
        if (metaRole === 'teacher' || metaRole === 'student') {
          baseProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? 'User',
            role: metaRole as UserRole,
            phone: null,
            created_at: user.created_at,
            updated_at: user.created_at,
          };
        }
      }
    }

    // Default fallback profile if offline/mock
    if (!baseProfile) {
      baseProfile = {
        id: 'teacher-default',
        full_name: 'Prof. Rajesh Sharma',
        role: 'teacher',
        phone: '+91 98765 43210',
        institute_name: 'EduFlow Coaching Academy',
        specialization: 'Class 10-12 Mathematics & Physics Expert',
        qualifications: 'M.Sc. Mathematics • 8+ Years Teaching Experience',
        bio: 'Passionate educator dedicated to building strong problem-solving foundations and concept clarity for board and competitive exams.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Check for locally saved profile customizations
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

    // Ensure default values for tuition fields if missing
    if (baseProfile) {
      if (!baseProfile.institute_name) baseProfile.institute_name = 'EduFlow Coaching Academy';
      if (!baseProfile.specialization) baseProfile.specialization = 'Mathematics & Science Faculty';
      if (!baseProfile.qualifications) baseProfile.qualifications = 'Senior Faculty • 5+ Years Experience';
    }

    return baseProfile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const current = (await this.getCurrentProfile()) || {
      id: userId,
      full_name: 'Teacher',
      role: 'teacher',
      phone: null,
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

    // Attempt remote save to Supabase if connected
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
          institute_name: updatedProfile.institute_name,
          specialization: updatedProfile.specialization,
          qualifications: updatedProfile.qualifications,
          bio: updatedProfile.bio,
          updated_at: updatedProfile.updated_at,
        })
        .eq('id', userId);
    } catch {
      // ignore network errors if running in mock/offline mode
    }

    return updatedProfile;
  },
};