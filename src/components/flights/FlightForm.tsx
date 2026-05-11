'use client';
import { useRef, useState } from 'react';
import { Flight, FlightType, TransportType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { TRANSPORT_LABELS, TRANSPORT_TYPES } from '@/lib/transport';
import { formatStorageError } from '@/lib/storage';

interface FlightFormProps {
  tripId: string;
  initialData?: Partial<Flight>;
  tripDefaultDate?: string;
  onSubmit: (data: Omit<Flight, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}

// Labels for the international/internal sub-flag — only relevant when the
// transport type is 'flight'. Shown conditionally so the form stays simple
// for trains, buses, etc.
const FLIGHT_SCOPE_LABEL: Record<FlightType, string> = {
  international: 'טיסה בינלאומית',
  internal: 'טיסה פנימית',
};

// Per-type field labels — keeps Hebrew copy natural across transport modes.
const FIELD_LABELS: Record<TransportType, { carrier: string; from: string; to: string; carrierPlaceholder: string; fromPlaceholder: string; toPlaceholder: string }> = {
  flight: { carrier: 'חברת תעופה', from: 'נמל המראה', to: 'נמל נחיתה', carrierPlaceholder: 'למשל: El Al, Wizz Air', fromPlaceholder: 'למשל: TLV', toPlaceholder: 'למשל: NRT' },
  train: { carrier: 'חברת רכבת', from: 'תחנת מוצא', to: 'תחנת יעד', carrierPlaceholder: 'למשל: רכבת ישראל, SNCF', fromPlaceholder: 'למשל: תל אביב מרכז', toPlaceholder: 'למשל: ירושלים' },
  bus: { carrier: 'חברת אוטובוס', from: 'תחנת יציאה', to: 'תחנת הגעה', carrierPlaceholder: 'למשל: אגד, FlixBus', fromPlaceholder: 'תחנה מרכזית', toPlaceholder: 'תחנה מרכזית' },
  car: { carrier: 'חברת השכרה / רכב', from: 'מקור', to: 'יעד', carrierPlaceholder: 'למשל: Hertz, רכב פרטי', fromPlaceholder: 'מאיפה יוצאים', toPlaceholder: 'לאן מגיעים' },
  other: { carrier: 'מוביל', from: 'מקור', to: 'יעד', carrierPlaceholder: 'שם החברה (אופציונלי)', fromPlaceholder: 'מאיפה', toPlaceholder: 'לאן' },
};

export function FlightForm({ tripId, initialData, tripDefaultDate, onSubmit, onCancel }: FlightFormProps) {
  const [form, setForm] = useState<Omit<Flight, 'id'>>({
    tripId,
    type: (initialData?.type as FlightType) || 'international',
    transportType: initialData?.transportType ?? 'flight',
    airline: initialData?.airline || '',
    departureAirport: initialData?.departureAirport || '',
    arrivalAirport: initialData?.arrivalAirport || '',
    // ?? (not ||) so editing a flight with an explicitly empty date keeps it empty.
    departureDate: initialData?.departureDate ?? tripDefaultDate ?? '',
    departureTime: initialData?.departureTime || '',
    price: initialData?.price || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const set = <K extends keyof Omit<Flight, 'id'>>(key: K, value: Omit<Flight, 'id'>[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const transport: TransportType = form.transportType ?? 'flight';
  const labels = FIELD_LABELS[transport];
  const isFlight = transport === 'flight';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      // On success the parent typically closes the modal — nothing to do here.
    } catch (err) {
      // Don't swallow: surface the failure so the modal stops looking "stuck".
      // formatStorageError translates known Supabase codes (PGRST204/205) to
      // a clear Hebrew explanation of which migration to run.
      console.error(err);
      setError(formatStorageError(err, 'שמירת הנסיעה נכשלה'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // "edit" detection: any of the three core fields populated means we're
  // editing an existing item (used to pick the submit button label).
  const isEditing = initialData?.airline !== undefined
    || initialData?.departureAirport !== undefined
    || initialData?.id !== undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Select
        label="סוג נסיעה"
        value={transport}
        onChange={e => set('transportType', e.target.value as TransportType)}
      >
        {TRANSPORT_TYPES.map(t => (
          <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>
        ))}
      </Select>

      {isFlight && (
        <Select label="היקף הטיסה" value={form.type} onChange={e => set('type', e.target.value as FlightType)}>
          <option value="international">{FLIGHT_SCOPE_LABEL.international}</option>
          <option value="internal">{FLIGHT_SCOPE_LABEL.internal}</option>
        </Select>
      )}

      <Input label={labels.carrier} placeholder={labels.carrierPlaceholder} value={form.airline} onChange={e => set('airline', e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label={labels.from} placeholder={labels.fromPlaceholder} value={form.departureAirport} onChange={e => set('departureAirport', e.target.value)} />
        <Input label={labels.to} placeholder={labels.toPlaceholder} value={form.arrivalAirport} onChange={e => set('arrivalAirport', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך" type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
        <Input label="שעה" type="time" value={form.departureTime} onChange={e => set('departureTime', e.target.value)} />
      </div>

      <Input label="מחיר (אופציונלי)" placeholder="₪" value={form.price || ''} onChange={e => set('price', e.target.value)} />

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-right">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'שומר...' : isEditing ? 'שמור שינויים' : 'הוסף נסיעה'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
