// Single source of truth for whether Supabase is configured.
// If env vars are missing the app falls back to localStorage-only mode
// and the auth pages show a setup-required notice instead of crashing.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Optional — only needed for the Documents feature. When unset, the documents
// page renders a setup-required notice instead of an upload UI; nothing else
// in the app depends on this.
export const SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isDocumentStorageConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(SUPABASE_STORAGE_BUCKET);
}

export const SUPABASE_SETUP_HINT = `
Supabase is not configured. Create a .env.local file with:

  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Then run the SQL in supabase/schema.sql against your Supabase project.
The app will continue to work with browser-only localStorage until then.
`.trim();
