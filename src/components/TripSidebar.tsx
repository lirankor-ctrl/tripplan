'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Map as MapIcon, Hotel, UtensilsCrossed, Music, Package, Calendar,
  Camera, FileText, Printer, LayoutDashboard, ChevronRight, MoreHorizontal,
  Files, Receipt,
} from 'lucide-react';
import { Trip } from '@/lib/types';
import { useState } from 'react';

// Single source of truth for both desktop sidebar and mobile bottom nav.
// The /flights route is preserved (existing bookmarks keep working) — only
// the user-facing label changed to reflect the broader transport scope.
export const navItems = [
  { href: '/calendar', label: 'לוח שנה', icon: Calendar },
  { href: '/flights', label: 'נסיעות / הסעות', icon: MapIcon },
  { href: '/hotels', label: 'מלונות', icon: Hotel },
  { href: '/restaurants', label: 'מסעדות', icon: UtensilsCrossed },
  { href: '/events', label: 'אירועים', icon: Music },
  { href: '/documents', label: 'מסמכים', icon: Files },
  { href: '/expenses', label: 'הוצאות', icon: Receipt },
  { href: '/packing', label: 'אריזה', icon: Package },
  { href: '/photos', label: 'תמונות', icon: Camera },
  { href: '/notes', label: 'הערות', icon: FileText },
  { href: '', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/export', label: 'ייצוא', icon: Printer },
];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=200&q=60';

export function TripSidebar({ trip }: { trip: Trip }) {
  const pathname = usePathname();
  const base = `/trips/${trip.id}`;

  return (
    <aside className="w-60 bg-white border-l border-gray-100 min-h-screen flex flex-col" style={{ boxShadow: '0 0 15px rgba(0,0,0,0.04)' }} dir="rtl">
      {/* Trip info header */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 text-xs mb-4 transition-colors w-fit">
          <ChevronRight className="w-3.5 h-3.5" />
          <span>כל הטיולים</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={trip.coverImage || DEFAULT_COVER}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate text-sm leading-tight">{trip.name}</h2>
            {trip.destination && <p className="text-xs text-gray-400 truncate mt-0.5">{trip.destination}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const fullPath = `${base}${href}`;
          const isActive = href === '' ? pathname === base : pathname.startsWith(fullPath);
          return (
            <Link
              key={href}
              href={fullPath}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-0.5 transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function TripBottomNav({ trip }: { trip: Trip }) {
  const pathname = usePathname();
  const base = `/trips/${trip.id}`;
  const [showMore, setShowMore] = useState(false);

  // First 4 most-used + a "more" button
  const primaryItems = navItems.slice(0, 4);
  const secondaryItems = navItems.slice(4);

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 inset-x-0 bg-white border-t border-gray-100 shadow-lg px-2 py-3 grid grid-cols-3 gap-1" onClick={e => e.stopPropagation()}>
            {secondaryItems.map(({ href, label, icon: Icon }) => {
              const fullPath = `${base}${href}`;
              const isActive = href === '' ? pathname === base : pathname.startsWith(fullPath);
              return (
                <Link
                  key={href}
                  href={fullPath}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    'flex flex-col items-center py-2.5 px-1 rounded-xl text-xs transition-colors',
                    isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 pb-[env(safe-area-inset-bottom)]" dir="rtl">
        <div className="flex h-14">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const fullPath = `${base}${href}`;
            const isActive = href === '' ? pathname === base : pathname.startsWith(fullPath);
            return (
              <Link
                key={href}
                href={fullPath}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                  isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              showMore ? 'text-indigo-600' : 'text-gray-400'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>עוד</span>
          </button>
        </div>
      </nav>
    </>
  );
}
