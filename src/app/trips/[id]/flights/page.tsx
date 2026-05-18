'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight, Trip, TransportType } from '@/lib/types';
import { flightsStorage, tripsStorage } from '@/lib/storage';
import { formatDate, getTripDefaultDate, sortFlightsForDisplay } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { FlightForm } from '@/components/flights/FlightForm';
import { TRANSPORT_ICONS, TRANSPORT_LABELS, transportTypeOf } from '@/lib/transport';
import { Plus, Pencil, Trash2, Map as MapIcon } from 'lucide-react';

function TransportCard({ flight, onEdit, onDelete }: { flight: Flight; onEdit: () => void; onDelete: () => void }) {
  const t: TransportType = transportTypeOf(flight.transportType);
  // Static lookup (not a function call) so the static-components lint rule
  // accepts the JSX usage below.
  const Icon = TRANSPORT_ICONS[t];
  const label = TRANSPORT_LABELS[t];
  // Per-type background colour for the icon chip — keeps the existing flight
  // colour palette (blue) and varies hue for the other modes so the list
  // scans visually.
  const chipColor: Record<TransportType, string> = {
    flight: 'bg-blue-50 text-blue-500',
    train: 'bg-cyan-50 text-cyan-600',
    bus: 'bg-amber-50 text-amber-600',
    car: 'bg-emerald-50 text-emerald-600',
    other: 'bg-gray-50 text-gray-500',
  };

  // Only flights need the international/internal badge; other modes get the
  // mode label as a quick scan.
  const badgeText = t === 'flight'
    ? (flight.type === 'international' ? 'בינלאומית' : 'פנימית')
    : label;
  const badgeVariant: 'blue' | 'gray' | 'green' | 'orange' | 'purple' | 'indigo' = t === 'flight'
    ? (flight.type === 'international' ? 'blue' : 'gray')
    : t === 'train' ? 'indigo'
    : t === 'bus' ? 'orange'
    : t === 'car' ? 'green'
    : 'gray';

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4" dir="rtl">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${chipColor[t]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <Badge variant={badgeVariant}>{badgeText}</Badge>
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

        {/* Route — LTR for airport-code style; for other modes the words sit fine LTR too */}
        <div className="flex items-center gap-2 text-center" dir="ltr">
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900 tracking-wide">{flight.departureAirport || '---'}</p>
            {flight.departureDate && <p className="text-xs text-gray-500 mt-0.5">{formatDate(flight.departureDate)}</p>}
            {flight.departureTime && <p className="text-sm font-semibold text-indigo-600 mt-0.5">{flight.departureTime}</p>}
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-px bg-gray-200" />
              <Icon className="w-3.5 h-3.5 text-blue-400" />
              <div className="w-8 h-px bg-gray-200" />
            </div>
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
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [items, t] = await Promise.all([
          flightsStorage.getByTrip(id),
          tripsStorage.getById(id),
        ]);
        if (cancelled) return;
        setFlights(items);
        setTrip(t ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const tripDefaultDate = useMemo(() => getTripDefaultDate(trip, flights), [trip, flights]);
  // sortFlightsForDisplay already returns: undated first, then dated by date+time.
  const sortedFlights = useMemo(() => sortFlightsForDisplay(flights), [flights]);

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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">טיסות / העברות</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="w-4 h-4" />
          הוסף נסיעה
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : flights.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="אין טיסות או העברות עדיין"
          description="הוסף טיסות, רכבות, אוטובוסים או נסיעות ברכב לטיול שלך"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              הוסף נסיעה
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFlights.map(f => (
            <TransportCard
              key={f.id}
              flight={f}
              onEdit={() => setEditFlight(f)}
              onDelete={() => setDeleteId(f.id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="הוסף נסיעה">
        <FlightForm tripId={id} tripDefaultDate={tripDefaultDate} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!editFlight} onClose={() => setEditFlight(null)} title="עריכת נסיעה">
        {editFlight && (
          <FlightForm tripId={id} initialData={editFlight} onSubmit={handleEdit} onCancel={() => setEditFlight(null)} />
        )}
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת נסיעה" size="sm">
        <div className="space-y-4 text-center" dir="rtl">
          <p className="text-gray-600">האם למחוק את הנסיעה? לא ניתן לשחזר פעולה זו.</p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>מחק</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
