'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight, Restaurant, Trip } from '@/lib/types';
import { flightsStorage, restaurantsStorage, tripsStorage } from '@/lib/storage';
import { formatDate, getTripDefaultDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { RestaurantForm } from '@/components/restaurants/RestaurantForm';
import { Plus, UtensilsCrossed, Pencil, Trash2, MapPin, Clock, ExternalLink } from 'lucide-react';

export default function RestaurantsPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Restaurant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    restaurantsStorage.getByTrip(id).then(items => { if (!cancelled) setRestaurants(items); });
    tripsStorage.getById(id).then(t => { if (!cancelled) setTrip(t ?? null); });
    flightsStorage.getByTrip(id).then(items => { if (!cancelled) setFlights(items); });
    return () => { cancelled = true; };
  }, [id]);

  const tripDefaultDate = useMemo(() => getTripDefaultDate(trip, flights), [trip, flights]);

  const handleAdd = async (data: Omit<Restaurant, 'id'>) => {
    const r = await restaurantsStorage.create(data);
    setRestaurants(prev => [...prev, r]);
    setShowAdd(false);
  };
  const handleEdit = async (data: Omit<Restaurant, 'id'>) => {
    if (!editItem) return;
    await restaurantsStorage.update(editItem.id, data);
    setRestaurants(await restaurantsStorage.getByTrip(id));
    setEditItem(null);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    await restaurantsStorage.delete(deleteId);
    setRestaurants(prev => prev.filter(r => r.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">מסעדות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף מסעדה
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="אין מסעדות עדיין"
          description="הוסף מסעדות ומקומות אכילה לטיול שלך"
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />הוסף מסעדה</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map(r => (
            <Card key={r.id} className="overflow-hidden">
              {r.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardBody className="p-5" dir="rtl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{r.name}</h3>
                      {r.city && <p className="text-sm text-gray-500">{r.city}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditItem(r)} aria-label="ערוך" className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} aria-label="מחק" className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {(r.date || r.time) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{r.date && formatDate(r.date)}{r.date && r.time && ' · '}{r.time}</span>
                    </div>
                  )}
                  {r.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {r.location.startsWith('http') ? (
                        <a href={r.location} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                          מפה <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{r.location}</span>
                      )}
                    </div>
                  )}
                </div>
                {r.notes && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-3">{r.notes}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף מסעדה">
        <RestaurantForm tripId={id} tripDefaultDate={tripDefaultDate} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="עריכת מסעדה">
        {editItem && <RestaurantForm tripId={id} initialData={editItem} onSubmit={handleEdit} onCancel={() => setEditItem(null)} />}
      </Modal>
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת מסעדה" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600">האם למחוק את המסעדה?</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
