'use client';
import { useRef, useState } from 'react';
import { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface HotelFormProps {
  tripId: string;
  initialData?: Partial<Hotel>;
  tripDefaultDate?: string;
  onSubmit: (data: Omit<Hotel, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}

export function HotelForm({ tripId, initialData, tripDefaultDate, onSubmit, onCancel }: HotelFormProps) {
  const [form, setForm] = useState<Omit<Hotel, 'id'>>({
    tripId,
    city: initialData?.city || '',
    hotelName: initialData?.hotelName || '',
    // ?? (not ||) so editing a hotel saved without dates keeps them empty.
    arrivalDate: initialData?.arrivalDate ?? tripDefaultDate ?? '',
    departureDate: initialData?.departureDate ?? tripDefaultDate ?? '',
    notes: initialData?.notes || '',
    price: initialData?.price || '',
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
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'שומר...' : initialData?.hotelName !== undefined ? 'שמור שינויים' : 'הוסף מלון'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
