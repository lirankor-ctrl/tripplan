'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthCard, NotConfiguredNotice } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const { signIn, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!configured) {
      setError('שירות ההתחברות אינו זמין כעת.');
      return;
    }
    if (!email.trim() || !password) {
      setError('יש להזין אימייל וסיסמה.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: failure } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (failure) {
      setError(failure.message);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <AuthCard title="התחברות" subtitle="התחבר לחשבון כדי לראות את הטיולים שלך מכל מכשיר">
      {!configured && <div className="mb-4"><NotConfiguredNotice /></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="אימייל"
          type="email"
          autoComplete="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="סיסמה"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-500 text-right">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting || !configured}>
          {submitting ? 'מתחבר...' : 'התחבר'}
        </Button>
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password" className="text-indigo-600 hover:underline">שכחת סיסמה?</Link>
        <span className="text-gray-500">
          אין לך חשבון?{' '}
          <Link href="/signup" className="text-indigo-600 font-medium hover:underline">צור חשבון</Link>
        </span>
      </div>
    </AuthCard>
  );
}

// useSearchParams requires a Suspense boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 text-sm">טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}
