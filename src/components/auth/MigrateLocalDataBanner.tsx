'use client';
import { useState, useSyncExternalStore } from 'react';
import { useAuth } from './AuthProvider';
import { backupStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Cloud, X } from 'lucide-react';

// useSyncExternalStore is the React-blessed way to read from browser APIs
// without falling foul of the "no setState in effect" lint rule. We don't
// need to subscribe (localStorage doesn't fire events from this tab), so
// the subscribe fn is a no-op.
const noopSubscribe = () => () => {};

interface Props {
  onDone: () => void;
}

// Shown on the homepage when a signed-in user still has trips sitting
// in their browser's localStorage from before they had an account.
export function MigrateLocalDataBanner({ onDone }: Props) {
  const { user, configured } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Read localStorage in a SSR-safe way. Server snapshot returns false so the
  // banner never appears in HTML, then hydrates to the real value on the client.
  const hasLocal = useSyncExternalStore(
    noopSubscribe,
    () => backupStorage.hasLocalData(),
    () => false,
  );

  const show = configured && !!user && hasLocal && !dismissed;
  if (!show) return null;

  const handleMigrate = async () => {
    setRunning(true);
    const r = await backupStorage.migrateLocalToCloud();
    setRunning(false);
    if ('error' in r) {
      setResult(r.error);
      return;
    }
    setResult(`הועלו ${r.trips} טיולים לענן`);
    backupStorage.clearLocal();
    onDone();
    setTimeout(() => setDismissed(true), 1800);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3" dir="rtl">
      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Cloud className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">יש לך נתונים מקומיים מהמכשיר הזה</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {result ?? 'אפשר להעלות אותם לחשבון שלך כדי שיהיו זמינים בכל מכשיר.'}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button onClick={handleMigrate} size="sm" disabled={running}>
          {running ? 'מסנכרן...' : 'סנכרן לענן'}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-gray-600 min-w-[36px] min-h-[36px]"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
