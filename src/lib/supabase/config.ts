// Single source of truth for whether Supabase is configured.
// If env vars are missing the app falls back to localStorage-only mode
// and the auth pages show a setup-required notice instead of crashing.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Default to 'trip-documents' so deployments don't need a custom env var.
// Override with NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET if you renamed the bucket.
export const SUPABASE_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'trip-documents';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Document storage is "configured" as long as Supabase itself is configured —
// the bucket has a sane default ('trip-documents'). Auth is checked
// separately at the UI layer because it's an async / per-session concern.
export function isDocumentStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export const SUPABASE_SETUP_HINT = `
Supabase is not configured. Create a .env.local file with:

  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Then run the SQL in supabase/schema.sql against your Supabase project.
The app will continue to work with browser-only localStorage until then.
`.trim();
