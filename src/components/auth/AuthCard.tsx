import { ReactNode } from 'react';
import { Compass } from 'lucide-react';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Compass className="w-6 h-6 text-indigo-600" />
        <span className="text-lg font-bold text-gray-900">TripPlan</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 text-center mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 text-center mb-6">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function NotConfiguredNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
      <p className="font-semibold mb-1">Supabase לא מוגדר</p>
      <p>
        כדי להפעיל הרשמה והתחברות, הוסף את המשתנים{' '}
        <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> ו-
        <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
        לקובץ <code className="text-xs bg-amber-100 px-1 rounded">.env.local</code>.
      </p>
      <p className="mt-2">בינתיים האפליקציה עובדת על אחסון מקומי במכשיר.</p>
    </div>
  );
}
