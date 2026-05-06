'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { AuthCard, NotConfiguredNotice } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    if (password.length < 6) {
      setError('סיסמה חייבת להיות לפחות 6 תווים');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      console.error('[auth] updateUser failed:', error);
      const raw = error.message.toLowerCase();
      if (raw.includes('weak') || raw.includes('short')) {
        setError('הסיסמה חלשה מדי. נסה סיסמה ארוכה יותר.');
      } else if (raw.includes('expired') || raw.includes('invalid') || raw.includes('session')) {
        setError('הקישור פג תוקף. בקש קישור איפוס חדש.');
      } else {
        setError('שגיאה בעדכון הסיסמה. נסה לבקש קישור חדש.');
      }
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <AuthCard title="איפוס סיסמה" subtitle="בחר סיסמה חדשה">
      {!configured && <div className="mb-4"><NotConfiguredNotice /></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="סיסמה חדשה"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="לפחות 6 תווים"
        />
        <Input
          label="אישור סיסמה"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || !configured}>
          {submitting ? 'מעדכן...' : 'עדכן סיסמה'}
        </Button>
      </form>
    </AuthCard>
  );
}
