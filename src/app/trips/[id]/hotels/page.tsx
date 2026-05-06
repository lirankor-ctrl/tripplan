'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight, Hotel, Trip } from '@/lib/types';
import { flightsStorage, hotelsStorage, tripsStorage } from '@/lib/storage';
import { formatDate, getTripDefaultDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { HotelForm } from '@/components/hotels/HotelForm';
import { Plus, Hotel as HotelIcon, Pencil, Trash2, MapPin, Calendar } from 'lucide-react';

export default function HotelsPage() {
  const { id } = useParams<{ id: string }>();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hotelsStorage.getByTrip(id).then(items => { if (!cancelled) setHotels(items); });
    tripsStorage.getById(id).then(t => { if (!cancelled) setTrip(t ?? null); });
    flightsStorage.getByTrip(id).then(items => { if (!cancelled) setFlights(items); });
    return () => { cancelled = true; };
  }, [id]);

  const tripDefaultDate = useMemo(() => getTripDefaultDate(trip, flights), [trip, flights]);

  const handleAdd = async (data: Omit<Hotel, 'id'>) => {
    const h = await hotelsStorage.create(data);
    setHotels(prev => [...prev, h]);
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<Hotel, 'id'>) => {
    if (!editHotel) return;
    await hotelsStorage.update(editHotel.id, data);
    setHotels(await hotelsStorage.getByTrip(id));
    setEditHotel(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await hotelsStorage.delete(deleteId);
    setHotels(prev => prev.filter(h => h.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">מלונות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף מלון
        </Button>
      </div>

      {hotels.length === 0 ? (
        <EmptyState
          icon={HotelIcon}
          title="אין מלונות עדיין"
          description="הוסף פרטי לינה לטיול שלך"
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />הוסף מלון</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.map(hotel => (
            <Card key={hotel.id}>
              <CardBody className="p-5" dir="rtl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <HotelIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{hotel.hotelName || 'מלון ללא שם'}</h3>
                      {hotel.city && (
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <MapPin className="w-3 h-3" />
                          {hotel.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditHotel(hotel)} aria-label="ערוך" className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(hotel.id)} aria-label="מחק" className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {(hotel.arrivalDate || hotel.departureDate) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>
                      {hotel.arrivalDate && formatDate(hotel.arrivalDate)}
                      {hotel.arrivalDate && hotel.departureDate && ' — '}
                      {hotel.departureDate && formatDate(hotel.departureDate)}
                    </span>
                  </div>
                )}

                {hotel.notes && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-2">{hotel.notes}</p>}

                {hotel.price && (
                  <p className="text-sm font-semibold text-green-600 mt-2 text-right">₪{hotel.price}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף מלון">
        <HotelForm tripId={id} tripDefaultDate={tripDefaultDate} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editHotel} onClose={() => setEditHotel(null)} title="עריכת מלון">
        {editHotel && <HotelForm tripId={id} initialData={editHotel} onSubmit={handleEdit} onCancel={() => setEditHotel(null)} />}
      </Modal>
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת מלון" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600">האם למחוק את המלון?</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
