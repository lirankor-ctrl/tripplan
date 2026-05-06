'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trip } from '@/lib/types';
import { tripsStorage } from '@/lib/storage';
import { TripSidebar, TripBottomNav } from '@/components/TripSidebar';
import Link from 'next/link';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    tripsStorage.getById(id).then(t => {
      if (cancelled) return;
      setTrip(t ?? null);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [id]);

  // Don't flash "not found" on initial mount before localStorage is read
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center space-y-3">
          <p className="text-gray-500 text-lg">הטיול לא נמצא</p>
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            חזור לכל הטיולים
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Desktop sidebar */}
      <div className="hidden md:block no-print">
        <TripSidebar trip={trip} />
      </div>

      {/* Main content — extra bottom padding on mobile clears the fixed bottom nav + iOS safe-area */}
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 min-w-0 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden no-print">
        <TripBottomNav trip={trip} />
      </div>
    </div>
  );
}
