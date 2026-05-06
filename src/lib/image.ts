// Browser-only image utilities. Always re-encodes to JPEG so PNG/WEBP
// originals end up at predictable size.

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function isAllowedImage(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type.toLowerCase());
}

export function findImageInClipboard(items: DataTransferItemList | null | undefined): File | null {
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

export async function processImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.75,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image_decode_failed'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_unavailable');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
