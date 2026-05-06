'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config';

let cachedClient: SupabaseClient | null = null;

// Returns null when env vars are missing — callers must handle that case.
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cachedClient;
}
