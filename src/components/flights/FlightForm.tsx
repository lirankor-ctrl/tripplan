'use client';
import { useRef, useState } from 'react';
import { Flight, FlightType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

interface FlightFormProps {
  tripId: string;
  initialData?: Partial<Flight>;
  tripDefaultDate?: string;
  onSubmit: (data: Omit<Flight, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}

export function FlightForm({ tripId, initialData, tripDefaultDate, onSubmit, onCancel }: FlightFormProps) {
  const [form, setForm] = useState<Omit<Flight, 'id'>>({
    tripId,
    type: (initialData?.type as FlightType) || 'international',
    airline: initialData?.airline || '',
    departureAirport: initialData?.departureAirport || '',
    arrivalAirport: initialData?.arrivalAirport || '',
    // ?? (not ||) so editing a flight with an explicitly empty date keeps it empty.
    departureDate: initialData?.departureDate ?? tripDefaultDate ?? '',
    departureTime: initialData?.departureTime || '',
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
      <Select label="סוג טיסה" value={form.type} onChange={e => set('type', e.target.value)}>
        <option value="international">טיסה בינלאומית</option>
        <option value="internal">טיסה פנימית</option>
      </Select>

      <Input label="חברת תעופה" placeholder="למשל: El Al, Wizz Air" value={form.airline} onChange={e => set('airline', e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="נמל המראה" placeholder="למשל: TLV" value={form.departureAirport} onChange={e => set('departureAirport', e.target.value)} />
        <Input label="נמל נחיתה" placeholder="למשל: NRT" value={form.arrivalAirport} onChange={e => set('arrivalAirport', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך יציאה" type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
        <Input label="שעת המראה" type="time" value={form.departureTime} onChange={e => set('departureTime', e.target.value)} />
      </div>

      <Input label="מחיר (אופציונלי)" placeholder="₪" value={form.price || ''} onChange={e => set('price', e.target.value)} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'שומר...' : initialData?.airline !== undefined ? 'שמור שינויים' : 'הוסף טיסה'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
