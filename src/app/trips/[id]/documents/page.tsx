'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { TripDocument } from '@/lib/types';
import { documentsStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { DocumentForm } from '@/components/documents/DocumentForm';
import { DOCUMENT_CATEGORY_LABELS, deleteUploadedDocument, formatFileSize } from '@/lib/documents';
import { isDocumentStorageConfigured, isSupabaseConfigured, SUPABASE_STORAGE_BUCKET } from '@/lib/supabase/config';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Plus, Files, Pencil, Trash2, Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

function isImageType(t?: string): boolean {
  return !!t && t.startsWith('image/');
}

// Per-card thumbnail / metadata. Pulled into its own component so each card
// can manage its own "image failed to load" state independently — without
// one broken file knocking out the whole grid.
function DocumentCard({
  doc,
  imageUrl,
  linkUrl,
  onEdit,
  onDelete,
}: {
  doc: TripDocument;
  // Strict: the URL to use for the <img> src. Only set once we have a
  // verified-usable URL (signed URL for private buckets, public URL only
  // when the bucket is actually public). undefined while signing is in
  // flight, or when no URL is usable — the card shows a clean placeholder.
  imageUrl: string | undefined;
  // Looser: the URL to use for "פתח" / "הורד" links. We can fall back to
  // the stored public URL here even on private buckets — Supabase's
  // download endpoint may still resolve via session cookies, and at worst
  // the user gets a 404 they can react to (vs. a silently-broken thumb).
  linkUrl: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isImage = isImageType(doc.fileType);
  const [imgFailed, setImgFailed] = useState(false);
  // Reset the failed flag whenever the URL we'd render changes — otherwise
  // a stale "broken" mark would persist across signed-URL refreshes.
  useEffect(() => { setImgFailed(false); }, [imageUrl]);

  const Icon = isImage ? ImageIcon : FileText;
  // Only render the <img> when we actually have a URL AND it hasn't failed.
  // Crucially, we do NOT render with a maybe-broken public URL while the
  // signed URL is loading — that flash can leave a cached broken icon in
  // some browsers.
  const showImage = isImage && !!imageUrl && !imgFailed;
  const showPlaceholder = isImage && !showImage;

  return (
    <Card className="overflow-hidden">
      {showImage && imageUrl && (
        <a
          href={linkUrl ?? imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-40 bg-gray-100 overflow-hidden"
        >
          <img
            src={imageUrl}
            alt={doc.name}
            className="w-full h-full object-cover"
            onError={() => {
              // eslint-disable-next-line no-console
              console.warn('[DocumentCard] image failed to load:', { id: doc.id, name: doc.name, url: imageUrl });
              setImgFailed(true);
            }}
          />
        </a>
      )}
      {showPlaceholder && (
        // Soft fallback. Three possible reasons we end up here:
        //   1. URL hasn't been signed yet (very brief).
        //   2. Signing failed (likely RLS / bucket misconfig).
        //   3. The browser tried the URL and got a non-image response.
        // In all three the user sees a clean placeholder, never a broken
        // image icon. The console.warn above pinpoints case 3.
        <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-400">
          <ImageIcon className="w-10 h-10" />
        </div>
      )}

      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-50 text-cyan-600">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{doc.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{DOCUMENT_CATEGORY_LABELS[doc.category]}</p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} aria-label="ערוך" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-w-[36px] min-h-[36px] flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} aria-label="מחק" className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 min-w-[36px] min-h-[36px] flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {doc.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 whitespace-pre-wrap">{doc.notes}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatFileSize(doc.fileSize)}</span>
          {linkUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-medium"
              >
                פתח <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={linkUrl}
                download={doc.name}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium"
              >
                הורד <Download className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <span className="text-gray-400">ללא קובץ</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function DocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<TripDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TripDocument | null>(null);

  const supabaseReady = isDocumentStorageConfigured();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const items = await documentsStorage.getByTrip(id);
        if (cancelled) return;
        setDocs(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Dev-mode diagnostics — visible in the browser console once per mount,
  // so we can quickly tell why upload is/isn't enabled in any environment.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      // eslint-disable-next-line no-console
      console.log('[DocumentsPage]', {
        isSupabaseConfigured: isSupabaseConfigured(),
        currentUserId: null,
        bucketName: SUPABASE_STORAGE_BUCKET,
        uploadEnabled: false,
      });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id ?? null;
      // eslint-disable-next-line no-console
      console.log('[DocumentsPage]', {
        isSupabaseConfigured: isSupabaseConfigured(),
        currentUserId: userId,
        bucketName: SUPABASE_STORAGE_BUCKET,
        uploadEnabled: Boolean(isSupabaseConfigured() && userId),
      });
    });
  }, []);

  // Newest first — documents don't have a date field of their own.
  const sortedDocs = useMemo(
    () => [...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [docs],
  );

  // Per-doc signed URL state. Three values:
  //   undefined → signing not attempted yet (or in flight) → render placeholder
  //   string    → signed URL ready, safe to use as <img src>
  //   null      → signing failed (e.g. RLS/bucket misconfig) → never use the
  //               stored public URL as <img src> on a private bucket; show the
  //               placeholder instead so we don't flash a broken icon.
  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase || docs.length === 0) {
      setSignedUrls({});
      return;
    }

    (async () => {
      // Sign each doc individually and update incrementally so the first
      // image appears the moment its URL is ready — no waiting on the
      // slowest one. Documents without filePath get null immediately
      // (legacy rows pre-storage; rendering falls back to linkUrl only).
      await Promise.all(
        docs.map(async d => {
          if (!d.filePath) {
            if (!cancelled) setSignedUrls(prev => ({ ...prev, [d.id]: null }));
            return;
          }
          const { data, error } = await supabase
            .storage
            .from(SUPABASE_STORAGE_BUCKET)
            .createSignedUrl(d.filePath, 60 * 60); // 1h browsing window
          if (cancelled) return;
          if (error || !data?.signedUrl) {
            // eslint-disable-next-line no-console
            console.warn('[DocumentsPage] createSignedUrl failed:', { id: d.id, name: d.name, path: d.filePath, error });
            setSignedUrls(prev => ({ ...prev, [d.id]: null }));
            return;
          }
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[DocumentsPage] signed URL ready:', { id: d.id, name: d.name, fileType: d.fileType, signed: data.signedUrl.slice(0, 80) + '…' });
          }
          setSignedUrls(prev => ({ ...prev, [d.id]: data.signedUrl }));
        }),
      );
    })();

    return () => { cancelled = true; };
  }, [docs]);

  const handleAdd = async (data: Omit<TripDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await documentsStorage.create(data);
    setDocs(prev => [created, ...prev]);
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<TripDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editItem) return;
    await documentsStorage.update(editItem.id, data);
    setDocs(await documentsStorage.getByTrip(id));
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Best-effort: delete the binary first so we don't orphan storage on row delete.
    await deleteUploadedDocument(deleteTarget.filePath);
    await documentsStorage.delete(deleteTarget.id);
    setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">מסמכים</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף מסמך
        </Button>
      </div>

      {!supabaseReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 text-right leading-relaxed">
          Supabase אינו מוגדר — יש להגדיר NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY כדי לאפשר שמירה והעלאה.
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={Files}
          title="אין מסמכים עדיין"
          description="העלה דרכון, ביטוח, כרטיסי טיסה והזמנות מלון — נשמר בטוח לטיול שלך"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              הוסף מסמך
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocs.map(doc => {
            // signedUrls value semantics:
            //   undefined → still signing → no <img> yet (placeholder)
            //   null      → signing failed → no <img> at all (placeholder),
            //               but the open/download links still try the stored
            //               public URL so the user has *something* to click.
            //   string    → signed URL ready → use for both <img> and links.
            const signed = signedUrls[doc.id];
            const imageUrl = typeof signed === 'string' ? signed : undefined;
            const linkUrl = typeof signed === 'string'
              ? signed
              : (doc.fileUrl || undefined);
            return (
              <DocumentCard
                key={doc.id}
                doc={doc}
                imageUrl={imageUrl}
                linkUrl={linkUrl}
                onEdit={() => setEditItem(doc)}
                onDelete={() => setDeleteTarget(doc)}
              />
            );
          })}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף מסמך">
        <DocumentForm tripId={id} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="עריכת מסמך">
        {editItem && (
          <DocumentForm tripId={id} initialData={editItem} onSubmit={handleEdit} onCancel={() => setEditItem(null)} />
        )}
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="מחיקת מסמך" size="sm">
        <div className="space-y-4 text-center" dir="rtl">
          <p className="text-gray-600">למחוק את המסמך &ldquo;{deleteTarget?.name}&rdquo;? פעולה זו תמחק גם את הקובץ ולא ניתן לשחזר.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
