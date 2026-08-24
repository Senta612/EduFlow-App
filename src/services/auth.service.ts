import { supabase } from '@/lib/supabase';
import { SignupFormData } from '@/types/auth';

export async function signUp(data: SignupFormData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
      },
    },
  });

  return { authData, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Deep link base configured for this app via the "eduflow" scheme in app.json.
// When the user opens the reset link from the email, Supabase redirects them
// back to the app at this address (the future password-reset screen route).
export const PASSWORD_RESET_REDIRECT_URL = 'eduflow://reset-password';

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RESET_REDIRECT_URL,
  });

  return { data, error };
}