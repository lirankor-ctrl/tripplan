import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir="rtl">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
