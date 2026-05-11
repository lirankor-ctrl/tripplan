'use client';
import { useEffect, useRef, useState } from 'react';
import type { TripDocument, DocumentCategory } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import {
  ACCEPTED_FILE_EXTENSIONS, ACCEPTED_FILE_TYPES,
  DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS,
  MAX_FILE_SIZE_BYTES, formatFileSize, isAcceptedFileType, uploadDocument,
} from '@/lib/documents';
import { isDocumentStorageConfigured, isSupabaseConfigured, SUPABASE_STORAGE_BUCKET } from '@/lib/supabase/config';
import { Camera, Upload, FileText, X } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { formatStorageError } from '@/lib/storage';

interface DocumentFormProps {
  tripId: string;
  initialData?: Partial<TripDocument>;
  onSubmit: (data: Omit<TripDocument, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  onCancel: () => void;
}

// Form for creating / editing a trip document. When editing, the existing
// file is kept unless the user selects a new one. Upload happens here so the
// parent gets back the final fileUrl/filePath ready to persist.
export function DocumentForm({ tripId, initialData, onSubmit, onCancel }: DocumentFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<DocumentCategory>(initialData?.category ?? 'other');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Auth state is async (reads the local Supabase session). 'unknown' lets us
  // hold back the UI for a render or two instead of flashing the wrong banner.
  const [authState, setAuthState] = useState<'unknown' | 'signed-in' | 'signed-out'>('unknown');
  const submittingRef = useRef(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseReady = isDocumentStorageConfigured();
  // Upload UI is enabled iff Supabase env vars are present AND the user
  // currently has a session — both are required for storage RLS.
  const uploadEnabled = supabaseReady && authState === 'signed-in';

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setAuthState('signed-out');
      return;
    }
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const userId = data.session?.user?.id ?? null;
      setAuthState(userId ? 'signed-in' : 'signed-out');

      // Dev-mode diagnostics so we can see why upload is/isn't enabled.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[DocumentForm]', {
          isSupabaseConfigured: isSupabaseConfigured(),
          currentUserId: userId,
          bucketName: SUPABASE_STORAGE_BUCKET,
          uploadEnabled: Boolean(supabaseReady && userId),
        });
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady]);

  const onFilePicked = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!isAcceptedFileType(file)) {
      setError(`סוג הקובץ אינו נתמך. ניתן להעלות רק: ${ACCEPTED_FILE_TYPES.join(', ')}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`הקובץ גדול מדי (${formatFileSize(file.size)}). מותר עד ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`);
      return;
    }
    setPickedFile(file);
    // Default the document name to the file name (without extension) when empty,
    // so the user doesn't have to retype it.
    if (!name.trim()) {
      const base = file.name.replace(/\.[^./]+$/, '');
      setName(base);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    if (!name.trim()) {
      setError('יש להזין שם למסמך.');
      return;
    }
    if (!isEditing && !pickedFile && !uploadEnabled) {
      // No file + can't upload = nothing to save — guard against empty rows.
      setError(
        supabaseReady
          ? 'יש להתחבר כדי להעלות קובץ.'
          : 'Supabase אינו מוגדר. לא ניתן להעלות קובץ.',
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let fileUrl = initialData?.fileUrl;
      let filePath = initialData?.filePath;
      let fileType = initialData?.fileType;
      let fileSize = initialData?.fileSize;

      if (pickedFile) {
        if (!supabaseReady) {
          setError('Supabase אינו מוגדר.');
          return;
        }
        const supabase = getSupabaseBrowser();
        const { data: sess } = await supabase!.auth.getSession();
        const userId = sess.session?.user?.id;
        if (!userId) {
          setError('יש להתחבר כדי להעלות קובץ.');
          return;
        }
        const uploaded = await uploadDocument(pickedFile, userId, tripId);
        fileUrl = uploaded.fileUrl;
        filePath = uploaded.filePath;
        fileType = uploaded.fileType;
        fileSize = uploaded.fileSize;
      }

      await onSubmit({
        tripId,
        name: name.trim(),
        category,
        notes: notes.trim() || undefined,
        fileUrl,
        filePath,
        fileType,
        fileSize,
      });
    } catch (err) {
      console.error(err);
      setError(formatStorageError(err, 'שמירת המסמך נכשלה'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Input
        label="שם המסמך"
        placeholder="למשל: דרכון של דנה"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <Select
        label="קטגוריה"
        value={category}
        onChange={e => setCategory(e.target.value as DocumentCategory)}
      >
        {DOCUMENT_CATEGORIES.map(c => (
          <option key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</option>
        ))}
      </Select>

      {/* File pickers — large mobile-friendly buttons. The capture attribute on
          the camera input asks the OS to open the camera directly on phones. */}
      {uploadEnabled ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 text-right">קובץ</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-5 h-5" />
              צלם מסמך
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5" />
              העלה קובץ
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => onFilePicked(e.target.files?.[0])}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_EXTENSIONS}
            className="hidden"
            onChange={e => onFilePicked(e.target.files?.[0])}
          />

          {/* Selected file preview / current file indicator */}
          {pickedFile ? (
            <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-xl">
              <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cyan-900 truncate">{pickedFile.name}</p>
                <p className="text-xs text-cyan-600">{formatFileSize(pickedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPickedFile(null)}
                aria-label="הסר קובץ"
                className="p-1.5 rounded-lg hover:bg-cyan-100 text-cyan-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : isEditing && initialData?.fileUrl ? (
            <p className="text-xs text-gray-500 text-right">הקובץ הקיים יישמר. בחר קובץ חדש כדי להחליף אותו.</p>
          ) : (
            <p className="text-xs text-gray-400 text-right">PDF, JPG, PNG, WEBP — עד {formatFileSize(MAX_FILE_SIZE_BYTES)}.</p>
          )}
        </div>
      ) : authState === 'unknown' ? (
        // Brief moment while we read the local Supabase session — keep
        // pickers off-screen so the warning doesn't flash.
        <div className="text-xs text-gray-400 text-right">בודק חיבור...</div>
      ) : !supabaseReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 text-right leading-relaxed">
          Supabase אינו מוגדר. יש להגדיר NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 text-right leading-relaxed">
          יש להתחבר לחשבון כדי להעלות מסמכים.
        </div>
      )}

      <Textarea
        label="הערות (אופציונלי)"
        placeholder="למשל: בתוקף עד 2030"
        value={notes}
        rows={3}
        onChange={e => setNotes(e.target.value)}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-right">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'שומר...' : isEditing ? 'שמור שינויים' : 'הוסף מסמך'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
