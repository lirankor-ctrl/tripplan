'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { backupStorage, BackupData } from '@/lib/storage';
import { Download, Upload } from 'lucide-react';

interface BackupRestoreProps {
  onRestored: () => void;
}

export function BackupRestore({ onRestored }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3500);
  };

  const handleExport = () => {
    const backup = backupStorage.exportLocal();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'הגיבוי יוצא בהצלחה');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string) as BackupData;
        if (!window.confirm('ייבוא הגיבוי ישכתב את כל הנתונים המקומיים. להמשיך?')) return;
        backupStorage.restoreLocal(backup);
        onRestored();
        showStatus('success', 'הגיבוי יובא בהצלחה');
      } catch {
        showStatus('error', 'שגיאה בייבוא — ייתכן שהקובץ פגום');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <span className="text-sm text-gray-500">גיבוי מקומי:</span>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4" />
            ייצוא גיבוי
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
            <Upload className="w-4 h-4" />
            ייבוא גיבוי
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      {status && (
        <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
