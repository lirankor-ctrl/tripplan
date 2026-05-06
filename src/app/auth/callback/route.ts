import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// Supabase email-confirmation and password-reset links land here.
// We exchange the ?code= for a session cookie, then redirect.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
