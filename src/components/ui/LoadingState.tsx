'use client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

// Centered spinner + Hebrew caption. Used by data pages while async storage
// reads are in flight, so the empty-state UI never flashes before real data.
export function LoadingState({ label = 'טוען נתונים...', className }: LoadingStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-20 text-center', className)}
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
