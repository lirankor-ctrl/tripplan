'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { notesStorage } from '@/lib/storage';
import { Loader2, Save, Check } from 'lucide-react';

export default function NotesPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // loading is true until the saved note has been fetched. We disable the
  // textarea so the user can't type into a void and have their input
  // clobbered when the saved content arrives.
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    notesStorage.getByTrip(id)
      .then(note => {
        if (cancelled) return;
        if (note) {
          setContent(note.content);
          setSavedAt(note.updatedAt);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    try {
      const note = await notesStorage.save(id, text);
      setSavedAt(note.updatedAt);
    } finally {
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  }, [id]);

  // Keep saveRef in sync so the debounce closure always uses the latest version.
  // Done in an effect to avoid the Next 16 "ref-during-render" lint rule.
  useEffect(() => { saveRef.current = save; }, [save]);

  const handleChange = (text: string) => {
    setContent(text);
    setJustSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRef.current?.(text), 800);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col h-full" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">הערות</h1>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 h-6">
          {loading && (
            <span className="flex items-center gap-1 text-indigo-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              טוען נתונים...
            </span>
          )}
          {!loading && saving && (
            <span className="flex items-center gap-1 text-indigo-400 animate-pulse">
              <Save className="w-3.5 h-3.5" />
              שומר...
            </span>
          )}
          {!loading && !saving && justSaved && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="w-3.5 h-3.5" />
              נשמר
            </span>
          )}
          {!loading && !saving && !justSaved && savedAt && (
            <span className="text-gray-400">
              עודכן {new Date(savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[55dvh] md:min-h-[65vh]">
        <textarea
          dir="rtl"
          value={content}
          onChange={e => handleChange(e.target.value)}
          disabled={loading}
          placeholder={loading ? 'טוען נתונים...' : `כתוב כאן הערות חופשיות, תזכורות, רעיונות ומידע חשוב...

• מספרי טלפון חשובים
• כתובות
• המלצות של חברים
• שעות פתיחה
• כל מה שתרצה לזכור`}
          className="flex-1 w-full p-4 md:p-6 text-gray-800 placeholder:text-gray-300 text-base leading-7 resize-none focus:outline-none bg-transparent min-h-[55dvh] md:min-h-[65vh] disabled:cursor-wait"
          style={{ direction: 'rtl' }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-400 text-left">
        נשמר אוטומטית
      </p>
    </div>
  );
}
