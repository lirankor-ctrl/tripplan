// Helpers around the Documents feature: storage detection, file validation,
// and the actual upload/delete against Supabase Storage. Kept separate from
// the generic storage layer because it deals with binary uploads, not rows.

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseBrowser } from './supabase/client';
import { SUPABASE_STORAGE_BUCKET, isDocumentStorageConfigured } from './supabase/config';
import type { DocumentCategory } from './types';

export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.webp';
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — generous for ticket scans

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  passport: 'דרכון',
  insurance: 'ביטוח',
  flight_ticket: 'כרטיסי טיסה',
  hotel_booking: 'הזמנת מלון',
  car_rental: 'השכרת רכב',
  event_ticket: 'כרטיסים לאירועים',
  visa: 'ויזה',
  other: 'אחר',
};

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'passport', 'insurance', 'flight_ticket', 'hotel_booking',
  'car_rental', 'event_ticket', 'visa', 'other',
];

export function isAcceptedFileType(file: File): boolean {
  return (ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type);
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Strip characters that don't survive URL-encoding well in storage keys.
function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\d.\-_]+/g, '_').slice(0, 80) || 'file';
}

export interface UploadedDocument {
  filePath: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// Upload a file to the configured bucket under {userId}/{tripId}/. Returns the
// data the caller needs to persist a trip_documents row. Throws when storage
// isn't configured — callers must check isDocumentStorageConfigured() first.
export async function uploadDocument(
  file: File,
  userId: string,
  tripId: string,
): Promise<UploadedDocument> {
  if (!isDocumentStorageConfigured()) {
    throw new Error('אחסון מסמכים אינו מוגדר.');
  }
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Supabase client not initialised.');

  const safeName = sanitizeFilename(file.name);
  const filePath = `${userId}/${tripId}/${uuidv4()}-${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (uploadError) throw uploadError;

  // Public URL works only when the bucket is public; for private buckets the
  // page should generate a signed URL on-demand instead. We default to public
  // here — switch to createSignedUrl in getDownloadUrl below if you make the
  // bucket private.
  const { data: pub } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    filePath,
    fileUrl: pub.publicUrl,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };
}

export async function deleteUploadedDocument(filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  if (!isDocumentStorageConfigured()) return;
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  // Best-effort — even if this fails the row delete still goes through so the
  // user isn't blocked. Orphaned files can be cleaned up out-of-band.
  await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([filePath]).catch(() => {});
}

// For private buckets only — returns a 1h signed URL. Not used by the default
// (public-bucket) flow but kept here so the documents page can call it once
// you flip the bucket to private.
export async function getSignedDownloadUrl(filePath: string): Promise<string | null> {
  if (!isDocumentStorageConfigured()) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 60);
  return data?.signedUrl ?? null;
}
