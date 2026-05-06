'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight } from '@/lib/types';
import { flightsStorage } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { FlightForm } from '@/components/flights/FlightForm';
import { Plus, Plane, Pencil, Trash2 } from 'lucide-react';

function FlightCard({ flight, onEdit, onDelete }: { flight: Flight; onEdit: () => void; onDelete: () => void }) {
  const isIntl = flight.type === 'international';

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4" dir="rtl">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isIntl ? 'bg-blue-50' : 'bg-sky-50'}`}>
              <Plane className={`w-4 h-4 ${isIntl ? 'text-blue-500' : 'text-sky-500'}`} />
            </div>
            <div>
              <Badge variant={isIntl ? 'blue' : 'gray'}>{isIntl ? 'בינלאומית' : 'פנימית'}</Badge>
              {flight.airline && <p className="text-sm font-semibold text-gray-800 mt-1">{flight.airline}</p>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} aria-label="ערוך" className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} aria-label="מחק" className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Outbound route — always LTR for airline ticket convention */}
        <div className="flex items-center gap-2 text-center" dir="ltr">
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900 tracking-wide">{flight.departureAirport || '---'}</p>
            {flight.departureDate && <p className="text-xs text-gray-500 mt-0.5">{formatDate(flight.departureDate)}</p>}
            {flight.departureTime && <p className="text-sm font-semibold text-indigo-600 mt-0.5">{flight.departureTime}</p>}
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-px bg-gray-200" />
              <Plane className="w-3.5 h-3.5 text-blue-400" />
              <div className="w-8 h-px bg-gray-200" />
            </div>
            <span className="text-xs text-gray-400">✈</span>
          </div>

          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900 tracking-wide">{flight.arrivalAirport || '---'}</p>
            {flight.departureDate && <p className="text-xs text-transparent mt-0.5">-</p>}
          </div>
        </div>

        {flight.price && (
          <p className="text-sm font-semibold text-green-600 mt-3 text-right">₪{flight.price}</p>
        )}
      </CardBody>
    </Card>
  );
}

export default function FlightsPage() {
  const { id } = useParams<{ id: string }>();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    flightsStorage.getByTrip(id).then(items => { if (!cancelled) setFlights(items); });
    return () => { cancelled = true; };
  }, [id]);

  const handleAdd = async (data: Omit<Flight, 'id'>) => {
    const f = await flightsStorage.create(data);
    setFlights(prev => [...prev, f]);
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<Flight, 'id'>) => {
    if (!editFlight) return;
    await flightsStorage.update(editFlight.id, data);
    setFlights(await flightsStorage.getByTrip(id));
    setEditFlight(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await flightsStorage.delete(deleteId);
    setFlights(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">טיסות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף טיסה
        </Button>
      </div>

      {flights.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="אין טיסות עדיין"
          description="הוסף את פרטי הטיסות הבינלאומיות והפנימיות שלך"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              הוסף טיסה
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flights.map(f => (
            <FlightCard
              key={f.id}
              flight={f}
              onEdit={() => setEditFlight(f)}
              onDelete={() => setDeleteId(f.id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף טיסה">
        <FlightForm tripId={id} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!editFlight} onClose={() => setEditFlight(null)} title="עריכת טיסה">
        {editFlight && (
          <FlightForm tripId={id} initialData={editFlight} onSubmit={handleEdit} onCancel={() => setEditFlight(null)} />
        )}
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת טיסה" size="sm">
        <div className="space-y-4 text-center" dir="rtl">
          <p className="text-gray-600">האם למחוק את הטיסה? לא ניתן לשחזר פעולה זו.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
