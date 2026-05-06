'use client';
import { useState } from 'react';
import { Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface RestaurantFormProps {
  tripId: string;
  initialData?: Partial<Restaurant>;
  tripDefaultDate?: string;
  onSubmit: (data: Omit<Restaurant, 'id'>) => void;
  onCancel: () => void;
}

export function RestaurantForm({ tripId, initialData, tripDefaultDate, onSubmit, onCancel }: RestaurantFormProps) {
  const [form, setForm] = useState<Omit<Restaurant, 'id'>>({
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

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <Input label="עיר" placeholder="למשל: רומא" value={form.city} onChange={e => set('city', e.target.value)} />
        <Input label="שם המסעדה" placeholder="למשל: Osteria Francescana" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Input label="שעה" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
      </div>
      <Input label="מיקום / כתובת" placeholder="כתובת או קישור Google Maps" value={form.location || ''} onChange={e => set('location', e.target.value)} />
      <ImageUploader label="תמונה" value={form.imageUrl || ''} onChange={v => set('imageUrl', v)} />
      <Textarea label="הערות" placeholder="מידע נוסף..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} />

      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSubmit(form)} className="flex-1">
          {initialData?.name !== undefined ? 'שמור שינויים' : 'הוסף מסעדה'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">ביטול</Button>
      </div>
    </div>
  );
}
