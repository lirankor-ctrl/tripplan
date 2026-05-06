'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthCard, NotConfiguredNotice } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setError('');
    setSubmitting(true);
    const { error: failure } = await resetPassword(email.trim());
    setSubmitting(false);
    if (failure) {
      setError(failure.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="נשלח קישור איפוס" subtitle="בדוק את תיבת המייל שלך">
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          אם הכתובת קיימת במערכת, שלחנו קישור לאיפוס סיסמה אל{' '}
          <span className="font-medium text-gray-900" dir="ltr">{email}</span>.
        </p>
        <Link href="/login" className="block mt-6">
          <Button variant="secondary" className="w-full">חזור להתחברות</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="שכחת סיסמה?" subtitle="נשלח אליך קישור לאיפוס">
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
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || !configured}>
          {submitting ? 'שולח...' : 'שלח קישור איפוס'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-indigo-600 hover:underline">חזור להתחברות</Link>
      </p>
    </AuthCard>
  );
}
