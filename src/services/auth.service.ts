import { supabase } from '@/lib/supabase';
import { SignupFormData } from '@/types/auth';
import {
  AuthError,
  isAuthRetryableFetchError,
  Session,
  User,
} from '@supabase/supabase-js';

/**
 * Categorises the typable auth failures so UI layers can respond and display
 * friendly copy without reaching into raw Supabase error objects.
 */
export type AuthErrorKind =
  | 'email_not_confirmed'
  | 'email_exists'
  | 'invalid_credentials'
  | 'weak_password'
  | 'rate_limit'
  | 'network'
  | 'unknown';

const FRIENDLY_AUTH_MESSAGES: Record<AuthErrorKind, string> = {
  email_not_confirmed:
    'Please confirm your email before logging in. Check your inbox for the confirmation link.',
  email_exists: 'An account with that email already exists. Please sign in instead.',
  invalid_credentials: 'Email or password is incorrect.',
  weak_password: 'That password is too weak. Please choose a stronger one.',
  rate_limit: 'Too many attempts. Please wait a moment and try again.',
  network: 'Something went wrong. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

/**
 * Maps a Supabase auth error to a stable, known kind. Uses the documented
 * `error.code` values where available so classification does not rely on
 * fragile substring matching of server messages.
 */
export function classifyAuthError(
  error: AuthError | null,
): AuthErrorKind {
  if (!error) {
    return 'unknown';
  }

  if (isAuthRetryableFetchError(error)) {
    return 'network';
  }

  switch (error.code) {
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'email_exists':
      return 'email_exists';
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'weak_password':
      return 'weak_password';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate_limit';
    default:
      return 'unknown';
  }
}

/** Returns a user-safe copy for a classified auth error kind. */
export function getFriendlyAuthMessage(kind: AuthErrorKind): string {
  return FRIENDLY_AUTH_MESSAGES[kind];
}

/**
 * True when the returned Supabase user has actually verified their email.
 * An unconfirmed account has no `email_confirmed_at` regardless of whether
 * a session was issued for it (e.g. auto-confirm disabled vs enabled).
 */
export function isEmailConfirmed(user: User | null): boolean {
  return user?.email_confirmed_at != null;
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  /** True when the signup succeeded but the account still requires email verification. */
  requiresEmailConfirmation: boolean;
  error: AuthError | null;
  errorKind: AuthErrorKind | null;
}

export async function signUp(data: SignupFormData): Promise<SignUpResult> {
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

  if (error) {
    const errorKind = classifyAuthError(error);
    return {
      user: null,
      session: null,
      requiresEmailConfirmation: false,
      error,
      errorKind,
    };
  }

  const user = authData?.user ?? null;
  const session = authData?.session ?? null;

  // With email confirmation enabled Supabase returns no session here, so the
  // account is not yet usable. When a session is returned the user is already
  // confirmed (auto-confirm) and the AuthProvider will route them normally.
  const requiresEmailConfirmation = !isEmailConfirmed(user);

  return {
    user,
    session,
    requiresEmailConfirmation,
    error: null,
    errorKind: null,
  };
}

export interface SignInResult {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
  errorKind: AuthErrorKind | null;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      session: null,
      user: null,
      error,
      errorKind: classifyAuthError(error),
    };
  }

  return {
    session: data.session ?? null,
    user: data.user ?? null,
    error: null,
    errorKind: null,
  };
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

export interface UpdatePasswordResult {
  user: User | null;
  error: AuthError | null;
  errorKind: AuthErrorKind | null;
}

export async function updatePassword(password: string): Promise<UpdatePasswordResult> {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      user: null,
      error,
      errorKind: classifyAuthError(error),
    };
  }

  return {
    user: data.user ?? null,
    error: null,
    errorKind: null,
  };
}