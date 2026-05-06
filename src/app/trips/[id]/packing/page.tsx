'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PackingItem } from '@/lib/types';
import { packingStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Package, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['ביגוד', 'נעליים', 'היגיינה', 'תרופות', 'מסמכים', 'אלקטרוניקה', 'בידור', 'שונות'];

function PackingItemForm({ initialData, tripId, onSubmit, onCancel }: {
  initialData?: Partial<PackingItem>;
  tripId: string;
  onSubmit: (data: Omit<PackingItem, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !name.trim()) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({ tripId, name, category, isDone: initialData?.isDone || false });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Input label="שם הפריט" placeholder="למשל: דרכון" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <Select label="קטגוריה (אופציונלי)" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">ללא קטגוריה</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
      <div className="flex gap-3 pt-1">
        <Button type="submit" className="flex-1" disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? 'שומר...' : initialData?.name ? 'שמור' : 'הוסף'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">ביטול</Button>
      </div>
    </form>
  );
}

export default function PackingPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PackingItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'done' | 'pending'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    packingStorage.getByTrip(id)
      .then(items => { if (!cancelled) setItems(items); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const refresh = async () => setItems(await packingStorage.getByTrip(id));

  const handleAdd = async (data: Omit<PackingItem, 'id'>) => {
    await packingStorage.create(data);
    await refresh();
    setShowAdd(false);
  };
  const handleEdit = async (data: Omit<PackingItem, 'id'>) => {
    if (!editItem) return;
    await packingStorage.update(editItem.id, data);
    await refresh();
    setEditItem(null);
  };
  const toggleDone = async (item: PackingItem) => {
    // Optimistic toggle for snappy mobile feedback.
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isDone: !i.isDone } : i));
    await packingStorage.update(item.id, { isDone: !item.isDone });
  };
  const handleDelete = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    await packingStorage.delete(itemId);
  };

  const doneCount = items.filter(i => i.isDone).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const grouped = useMemo(() => {
    const filtered = items.filter(i => filter === 'all' || (filter === 'done' ? i.isDone : !i.isDone));
    const groups: Record<string, PackingItem[]> = {};
    filtered.forEach(item => {
      const key = item.category || 'שונות';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items, filter]);

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">רשימת אריזה</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף פריט
        </Button>
      </div>

      {loading && <LoadingState />}

      {!loading && items.length > 0 && (
        <Card className="mb-6">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">התקדמות</span>
              <span className="text-sm font-bold text-indigo-600">{doneCount}/{items.length} פריטים</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-l from-indigo-600 to-indigo-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              {(['all', 'pending', 'done'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {f === 'all' ? 'הכל' : f === 'pending' ? 'לא ארוז' : 'ארוז'}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="רשימת האריזה ריקה"
          description="הוסף פריטים לאריזה לפני הטיול"
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />הוסף פריט</Button>}
        />
      ) : !loading && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">{category}</h2>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                  >
                    <button
                      onClick={() => toggleDone(item)}
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        item.isDone
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-indigo-400'
                      )}
                    >
                      {item.isDone && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={cn('flex-1 text-sm', item.isDone && 'line-through text-gray-400')}>
                      {item.name}
                    </span>
                    <button onClick={() => setEditItem(item)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף פריט לאריזה" size="sm">
        <PackingItemForm tripId={id} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="עריכת פריט" size="sm">
        {editItem && <PackingItemForm tripId={id} initialData={editItem} onSubmit={handleEdit} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
