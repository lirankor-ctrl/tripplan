'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, User as UserIcon, LogIn } from 'lucide-react';

export function UserMenu() {
  const { user, signOut, configured, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!configured) return null;
  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-indigo-700 text-sm font-medium shadow-sm min-h-[40px]"
      >
        <LogIn className="w-4 h-4" />
        התחבר
      </Link>
    );
  }

  const initial = (user.email?.[0] || 'U').toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/90 hover:bg-white text-gray-700 text-sm font-medium shadow-sm min-h-[40px]"
        aria-label="תפריט משתמש"
      >
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {initial}
        </div>
        <span className="hidden sm:inline truncate max-w-[140px]" dir="ltr">{user.email}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50" dir="rtl">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" />
              <span>מחובר כ:</span>
            </div>
            <div className="text-sm text-gray-800 mt-0.5 truncate" dir="ltr">{user.email}</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              setOpen(false);
              router.refresh();
            }}
            className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            התנתקות
          </button>
        </div>
      )}
    </div>
  );
}
