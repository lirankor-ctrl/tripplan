'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthCard, NotConfiguredNotice } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const { signUp, configured } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    if (password.length < 6) {
      setError('סיסמה חייבת להיות לפחות 6 תווים');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error, needsConfirmation } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.includes('already registered') ? 'כתובת האימייל כבר רשומה' : 'שגיאה בהרשמה');
      return;
    }
    if (needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    router.push('/');
    router.refresh();
  };

  if (needsConfirmation) {
    return (
      <AuthCard title="אישור אימייל" subtitle="שלחנו אליך מייל">
        <div className="text-sm text-gray-600 leading-relaxed text-center">
          <p>שלחנו קישור לאישור החשבון לכתובת:</p>
          <p className="font-medium text-gray-900 mt-1" dir="ltr">{email}</p>
          <p className="mt-3">לחץ על הקישור במייל כדי להפעיל את החשבון, ואז התחבר.</p>
        </div>
        <Link href="/login" className="block mt-6">
          <Button variant="secondary" className="w-full">חזור להתחברות</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="הרשמה" subtitle="צור חשבון חדש כדי לסנכרן את הטיולים שלך">
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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="לפחות 6 תווים"
        />
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || !configured}>
          {submitting ? 'יוצר חשבון...' : 'צור חשבון'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        כבר יש לך חשבון?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">התחבר</Link>
      </p>
    </AuthCard>
  );
}
