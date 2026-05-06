'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Photo } from '@/lib/types';
import { photosStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Camera, Plus, Trash2, Pencil, X, ZoomIn } from 'lucide-react';

function PhotoForm({ onSubmit, onCancel }: {
  onSubmit: (imageData: string, caption: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [imageData, setImageData] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !imageData) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(imageData, caption);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <ImageUploader
        label="תמונה"
        value={imageData}
        onChange={setImageData}
        height="h-52"
      />
      <Input
        label="כיתוב (אופציונלי)"
        placeholder="תיאור קצר..."
        value={caption}
        onChange={e => setCaption(e.target.value)}
      />
      <div className="flex gap-3 pt-1">
        <Button type="submit" className="flex-1" disabled={!imageData || isSubmitting}>
          {isSubmitting ? 'שומר...' : 'הוסף תמונה'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}

export default function PhotosPage() {
  const { id } = useParams<{ id: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState<{ id: string; caption: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    photosStorage.getByTrip(id).then(items => { if (!cancelled) setPhotos(items); });
    return () => { cancelled = true; };
  }, [id]);

  const handleAdd = async (imageUrl: string, caption: string) => {
    const p = await photosStorage.create({ tripId: id, imageUrl, caption });
    setPhotos(prev => [...prev, p]);
    setShowAdd(false);
  };

  const handleDelete = async (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    if (lightbox?.id === photoId) setLightbox(null);
    await photosStorage.delete(photoId);
  };

  const handleSaveCaption = async () => {
    if (!editCaption) return;
    setPhotos(prev => prev.map(p => p.id === editCaption.id ? { ...p, caption: editCaption.caption } : p));
    setEditCaption(null);
    await photosStorage.update(editCaption.id, { caption: editCaption.caption });
  };

  // Navigate lightbox
  const currentLightboxIndex = lightbox ? photos.findIndex(p => p.id === lightbox.id) : -1;
  const goLightboxPrev = () => {
    if (currentLightboxIndex > 0) setLightbox(photos[currentLightboxIndex - 1]);
  };
  const goLightboxNext = () => {
    if (currentLightboxIndex < photos.length - 1) setLightbox(photos[currentLightboxIndex + 1]);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">אלבום תמונות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף תמונה
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="האלבום ריק"
          description="שמור תמונות מהטיול שלך כדי לזכור כל רגע"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              הוסף תמונה
            </Button>
          }
        />
      ) : (
        /* Masonry grid — each item has mb-3 directly for correct column spacing */
        <div className="columns-2 md:columns-3 lg:columns-4" style={{ columnGap: '0.75rem' }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-3 group relative rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption || 'תמונה'}
                className="w-full h-auto block cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setLightbox(photo)}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightbox(photo)}
                  className="p-1.5 bg-white/90 rounded-lg shadow text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditCaption({ id: photo.id, caption: photo.caption || '' })}
                  className="p-1.5 bg-white/90 rounded-lg shadow text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-1.5 bg-white/90 rounded-lg shadow text-gray-700 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                  <p className="text-white text-xs leading-snug">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add photo modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף תמונה">
        <PhotoForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit caption modal */}
      <Modal isOpen={!!editCaption} onClose={() => setEditCaption(null)} title="עריכת כיתוב" size="sm">
        {editCaption && (
          <div className="space-y-4" dir="rtl">
            <Input
              label="כיתוב"
              value={editCaption.caption}
              onChange={e => setEditCaption(ec => ec ? { ...ec, caption: e.target.value } : null)}
              placeholder="תיאור קצר..."
            />
            <div className="flex gap-3">
              <Button onClick={handleSaveCaption} className="flex-1">שמור</Button>
              <Button variant="secondary" onClick={() => setEditCaption(null)} className="flex-1">ביטול</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Close — pushed below the iOS notch via safe-area-top */}
          <button
            className="absolute top-2 right-2 p-3 text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 rounded-full"
            onClick={() => setLightbox(null)}
            style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
            aria-label="סגור"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {currentLightboxIndex > 0 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 rounded-full"
              onClick={e => { e.stopPropagation(); goLightboxPrev(); }}
              aria-label="הקודם"
            >
              <span className="text-3xl leading-none">›</span>
            </button>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-full px-3 py-6 sm:p-8 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.imageUrl}
              alt={lightbox.caption || ''}
              className="max-w-full max-h-[70vh] sm:max-h-[78vh] object-contain rounded-xl"
            />
            {lightbox.caption && (
              <p className="text-white/80 text-sm text-center px-4">{lightbox.caption}</p>
            )}
            <p className="text-white/40 text-xs">
              {currentLightboxIndex + 1} / {photos.length}
            </p>
            {/* Mobile-friendly action bar — always visible inside the lightbox */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditCaption({ id: lightbox.id, caption: lightbox.caption || '' });
                  setLightbox(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg min-h-[44px]"
              >
                <Pencil className="w-4 h-4" />
                ערוך כיתוב
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(lightbox.id);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                מחק
              </button>
            </div>
          </div>

          {/* Next */}
          {currentLightboxIndex < photos.length - 1 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 rounded-full"
              onClick={e => { e.stopPropagation(); goLightboxNext(); }}
              aria-label="הבא"
            >
              <span className="text-3xl leading-none">‹</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
