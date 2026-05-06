'use client';
import { useRef, useState } from 'react';
import { Event } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface EventFormProps {
  tripId: string;
  initialData?: Partial<Event>;
  tripDefaultDate?: string;
  onSubmit: (data: Omit<Event, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}

export function EventForm({ tripId, initialData, tripDefaultDate, onSubmit, onCancel }: EventFormProps) {
  const [form, setForm] = useState<Omit<Event, 'id'>>({
    tripId,
    city: initialData?.city || '',
    name: initialData?.name || '',
    // ?? (not ||) so editing an item with an explicitly empty date keeps it empty.
    date: initialData?.date ?? tripDefaultDate ?? '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    notes: initialData?.notes || '',
    imageUrl: initialData?.imageUrl || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <Input label="עיר" placeholder="למשל: לונדון" value={form.city} onChange={e => set('city', e.target.value)} />
        <Input label="שם האירוע / ההופעה" placeholder="למשל: Coldplay Concert" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Input label="שעה" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
      </div>
      <Input label="מיקום / כתובת" placeholder="כתובת או קישור Google Maps" value={form.location || ''} onChange={e => set('location', e.target.value)} />
      <ImageUploader label="תמונה" value={form.imageUrl || ''} onChange={v => set('imageUrl', v)} />
      <Textarea label="הערות" placeholder="מידע נוסף, פרטי כרטיסים..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'שומר...' : initialData?.name !== undefined ? 'שמור שינויים' : 'הוסף אירוע'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
