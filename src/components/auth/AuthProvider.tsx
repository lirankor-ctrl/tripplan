'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  mapSignUpError,
  mapSignInError,
  mapResetError,
  NO_CONFIG,
  type AuthFailure,
} from '@/lib/supabase/auth-errors';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthFailure | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthFailure | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthFailure | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      console.warn('[auth] Supabase env vars are missing — auth disabled.');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error('[auth] getUser failed:', error);
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[auth] state change:', event, session?.user?.email ?? null);
      }
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: NO_CONFIG };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapSignInError(error) };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: NO_CONFIG, needsConfirmation: false };

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth] signUp response:', { user: data?.user?.email, hasSession: !!data?.session, redirectTo });
    }

    if (error) return { error: mapSignUpError(error), needsConfirmation: false };

    // Supabase quirk: if the email is already registered with confirmations on, signUp returns
    // a user with empty identities array and no session — surface this as already_registered.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return {
        error: { message: 'כתובת האימייל כבר רשומה. נסה להתחבר במקום זאת.', code: 'already_registered' },
        needsConfirmation: false,
      };
    }

    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[auth] signOut failed:', error);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: NO_CONFIG };
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: mapResetError(error) };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, configured, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
