'use client';
import { useState } from 'react';
import { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface HotelFormProps {
  tripId: string;
  initialData?: Partial<Hotel>;
  onSubmit: (data: Omit<Hotel, 'id'>) => void;
  onCancel: () => void;
}

export function HotelForm({ tripId, initialData, onSubmit, onCancel }: HotelFormProps) {
  const [form, setForm] = useState<Omit<Hotel, 'id'>>({
    tripId,
    city: initialData?.city || '',
    hotelName: initialData?.hotelName || '',
    arrivalDate: initialData?.arrivalDate || '',
    departureDate: initialData?.departureDate || '',
    notes: initialData?.notes || '',
    price: initialData?.price || '',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <Input label="עיר" placeholder="למשל: פריז" value={form.city} onChange={e => set('city', e.target.value)} />
        <Input label="שם המלון" placeholder="למשל: Marriott" value={form.hotelName} onChange={e => set('hotelName', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך הגעה" type="date" value={form.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} />
        <Input label="תאריך עזיבה" type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
      </div>
      <Input label="מחיר (אופציונלי)" placeholder="₪" value={form.price || ''} onChange={e => set('price', e.target.value)} />
      <Textarea label="הערות" placeholder="מידע נוסף..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} />

      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSubmit(form)} className="flex-1">
          {initialData?.hotelName !== undefined ? 'שמור שינויים' : 'הוסף מלון'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">ביטול</Button>
      </div>
    </div>
  );
}
