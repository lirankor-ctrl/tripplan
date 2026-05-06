'use client';
import { useState } from 'react';
import { Trip } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface TripFormProps {
  initialData?: Partial<Trip>;
  onSubmit: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function TripForm({ initialData, onSubmit, onCancel }: TripFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    destination: initialData?.destination ?? '',
    startDate: initialData?.startDate ?? '',
    endDate: initialData?.endDate ?? '',
    coverImage: initialData?.coverImage ?? '',
  });
  const [nameError, setNameError] = useState('');

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setNameError('נא להזין שם לטיול');
      return;
    }
    onSubmit({ ...form, name: form.name.trim() });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Input
        label="שם הטיול *"
        placeholder="למשל: חופשת קיץ ביפן"
        value={form.name}
        onChange={e => { set('name', e.target.value); setNameError(''); }}
        error={nameError}
        autoFocus
      />
      <Input
        label="יעד"
        placeholder="למשל: טוקיו, יפן"
        value={form.destination}
        onChange={e => set('destination', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="תאריך התחלה"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
        />
        <Input
          label="תאריך סיום"
          type="date"
          value={form.endDate}
          onChange={e => set('endDate', e.target.value)}
          min={form.startDate || undefined}
        />
      </div>
      <ImageUploader
        label="תמונת שער"
        value={form.coverImage}
        onChange={v => set('coverImage', v)}
      />

      <div className="flex gap-3 pt-1">
        <Button onClick={handleSubmit} className="flex-1">
          {initialData?.name ? 'שמור שינויים' : 'צור טיול'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">ביטול</Button>
      </div>
    </div>
  );
}
