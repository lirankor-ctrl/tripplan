'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2, Camera, Upload } from 'lucide-react';
import { processImageFile, isAllowedImage, findImageInClipboard } from '@/lib/image';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: string; // tailwind height class for the preview/drop area
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  label,
  height = 'h-44',
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError('');
    if (!isAllowedImage(file)) {
      setError('סוג קובץ לא נתמך — JPG, PNG, WEBP בלבד');
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await processImageFile(file);
      onChange(dataUrl);
    } catch {
      setError('שגיאה בעיבוד התמונה');
    } finally {
      setProcessing(false);
    }
  };

  const triggerPicker = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = findImageInClipboard(e.clipboardData?.items);
    if (file) {
      e.preventDefault();
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError('');
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerPicker();
  };

  return (
    <div className={cn('space-y-1.5', className)} dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-gray-700 text-right">{label}</label>
      )}

      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(e) => {
          if (!processing) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="rounded-xl outline-none transition-all focus:ring-2 focus:ring-indigo-200"
      >
        {value ? (
          <div className={cn('relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50', height)}>
            <img src={value} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2 flex gap-2">
              <button
                type="button"
                onClick={handleReplace}
                disabled={processing}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/95 hover:bg-white text-gray-700 text-xs font-medium rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                החלף תמונה
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={processing}
                className="inline-flex items-center justify-center gap-1.5 bg-white/95 hover:bg-red-50 hover:text-red-600 text-gray-700 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                הסר תמונה
              </button>
            </div>
            {processing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 px-4 py-4 transition-colors',
              height,
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-200 bg-gray-50',
              processing && 'opacity-60 cursor-wait',
            )}
          >
            {processing ? (
              <>
                <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                <span className="text-sm text-gray-500">מעבד תמונה...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 text-center hidden sm:block">
                  גרור תמונה לכאן או בחר אפשרות
                </p>
                <p className="text-xs text-gray-400 text-center hidden sm:block">
                  JPG · PNG · WEBP — ניתן גם להדביק (Ctrl+V)
                </p>
                <div className="flex gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={triggerPicker}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
                  >
                    <Upload className="w-4 h-4" />
                    גלריה
                  </button>
                  <button
                    type="button"
                    onClick={triggerCamera}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    מצלמה
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {/* Mobile camera capture — opens the rear camera directly on phones */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  );
}
