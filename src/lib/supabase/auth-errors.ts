// Maps raw Supabase auth errors to user-friendly Hebrew messages.
// The raw error is always logged so production issues are debuggable from the browser console.

import type { AuthError } from '@supabase/supabase-js';

export type AuthFailure = {
  message: string; // Hebrew, safe to show users
  code: string;    // stable code for branching (e.g. needs_confirmation, already_registered)
};

export const NO_CONFIG: AuthFailure = {
  message: 'שירות ההתחברות אינו זמין כעת. נסה שוב מאוחר יותר.',
  code: 'not_configured',
};

export function mapSignUpError(err: AuthError | Error): AuthFailure {
  const raw = (err.message || '').toLowerCase();
  console.error('[auth] signUp failed:', err);

  if (raw.includes('already registered') || raw.includes('already been registered') || raw.includes('user already')) {
    return { message: 'כתובת האימייל כבר רשומה. נסה להתחבר במקום זאת.', code: 'already_registered' };
  }
  if (raw.includes('password') && (raw.includes('weak') || raw.includes('short') || raw.includes('at least'))) {
    return { message: 'הסיסמה חלשה מדי. השתמש בלפחות 6 תווים.', code: 'weak_password' };
  }
  if (raw.includes('invalid') && raw.includes('email')) {
    return { message: 'כתובת אימייל לא תקינה.', code: 'invalid_email' };
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return { message: 'יותר מדי ניסיונות. נסה שוב בעוד מספר דקות.', code: 'rate_limit' };
  }
  if (raw.includes('signups not allowed') || raw.includes('signup is disabled')) {
    return { message: 'הרשמה אינה זמינה כעת. פנה למנהל המערכת.', code: 'signups_disabled' };
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return { message: 'שגיאת רשת. בדוק את החיבור ונסה שוב.', code: 'network' };
  }
  return { message: 'אירעה שגיאה בהרשמה. נסה שוב.', code: 'unknown' };
}

export function mapSignInError(err: AuthError | Error): AuthFailure {
  const raw = (err.message || '').toLowerCase();
  console.error('[auth] signIn failed:', err);

  if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
    return { message: 'אימייל או סיסמה שגויים.', code: 'invalid_credentials' };
  }
  if (raw.includes('email not confirmed')) {
    return { message: 'יש לאשר את כתובת האימייל. בדוק את תיבת המייל שלך.', code: 'email_not_confirmed' };
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return { message: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד מספר דקות.', code: 'rate_limit' };
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return { message: 'שגיאת רשת. בדוק את החיבור ונסה שוב.', code: 'network' };
  }
  return { message: 'אירעה שגיאת התחברות. נסה שוב.', code: 'unknown' };
}

export function mapResetError(err: AuthError | Error): AuthFailure {
  console.error('[auth] resetPassword failed:', err);
  const raw = (err.message || '').toLowerCase();
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return { message: 'יותר מדי בקשות. נסה שוב בעוד מספר דקות.', code: 'rate_limit' };
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return { message: 'שגיאת רשת. בדוק את החיבור ונסה שוב.', code: 'network' };
  }
  return { message: 'שגיאה בשליחת המייל. בדוק את הכתובת ונסה שוב.', code: 'unknown' };
}
