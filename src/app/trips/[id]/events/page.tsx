'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Event, Flight, Trip } from '@/lib/types';
import { eventsStorage, flightsStorage, tripsStorage } from '@/lib/storage';
import { formatDate, getTripDefaultDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { EventForm } from '@/components/events/EventForm';
import { Plus, Music, Pencil, Trash2, MapPin, Clock, ExternalLink } from 'lucide-react';

export default function EventsPage() {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [items, t, f] = await Promise.all([
          eventsStorage.getByTrip(id),
          tripsStorage.getById(id),
          flightsStorage.getByTrip(id),
        ]);
        if (cancelled) return;
        setEvents(items);
        setTrip(t ?? null);
        setFlights(f);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const tripDefaultDate = useMemo(() => getTripDefaultDate(trip, flights), [trip, flights]);

  const handleAdd = async (data: Omit<Event, 'id'>) => {
    const e = await eventsStorage.create(data);
    setEvents(prev => [...prev, e]);
    setShowAdd(false);
  };
  const handleEdit = async (data: Omit<Event, 'id'>) => {
    if (!editItem) return;
    await eventsStorage.update(editItem.id, data);
    setEvents(await eventsStorage.getByTrip(id));
    setEditItem(null);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    await eventsStorage.delete(deleteId);
    setEvents(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 min-w-0 truncate">אירועים והופעות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm" className="flex-shrink-0" aria-label="הוסף אירוע">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">הוסף אירוע</span>
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Music}
          title="אין אירועים עדיין"
          description="הוסף הופעות, מופעים, וכרטיסים לטיול שלך"
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />הוסף אירוע</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(evt => (
            <Card key={evt.id} className="overflow-hidden">
              {evt.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <img src={evt.imageUrl} alt={evt.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardBody className="p-5" dir="rtl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Music className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{evt.name}</h3>
                      {evt.city && <p className="text-sm text-gray-500">{evt.city}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditItem(evt)} aria-label="ערוך" className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(evt.id)} aria-label="מחק" className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  {(evt.date || evt.time) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{evt.date && formatDate(evt.date)}{evt.date && evt.time && ' · '}{evt.time}</span>
                    </div>
                  )}
                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {evt.location.startsWith('http') ? (
                        <a href={evt.location} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                          מפה <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{evt.location}</span>
                      )}
                    </div>
                  )}
                </div>
                {evt.notes && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-3">{evt.notes}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף אירוע">
        <EventForm tripId={id} tripDefaultDate={tripDefaultDate} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="עריכת אירוע">
        {editItem && <EventForm tripId={id} initialData={editItem} onSubmit={handleEdit} onCancel={() => setEditItem(null)} />}
      </Modal>
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת אירוע" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600">האם למחוק את האירוע?</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
