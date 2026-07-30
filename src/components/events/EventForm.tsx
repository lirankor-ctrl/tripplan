'use client';
import { useRef, useState } from 'react';
import { ActivityType, Event } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_EMOJI, ACTIVITY_TYPE_LABELS } from '@/lib/activityTypes';

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
    // Legacy activities (no activityType in storage) show 'concert' (הופעה)
    // pre-selected here, matching how they already render everywhere else.
    activityType: initialData?.activityType ?? 'concert',
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
      <Select
        label="סוג פעילות"
        value={form.activityType ?? 'concert'}
        onChange={e => set('activityType', e.target.value as ActivityType)}
      >
        {ACTIVITY_TYPES.map(t => (
          <option key={t} value={t}>{ACTIVITY_TYPE_EMOJI[t]} {ACTIVITY_TYPE_LABELS[t]}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input label="עיר" placeholder="למשל: לונדון" value={form.city} onChange={e => set('city', e.target.value)} />
        <Input label="שם הפעילות / ההופעה" placeholder="למשל: Coldplay Concert" value={form.name} onChange={e => set('name', e.target.value)} />
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
          {isSubmitting ? 'שומר...' : initialData?.name !== undefined ? 'שמור שינויים' : 'הוסף פעילות'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}
