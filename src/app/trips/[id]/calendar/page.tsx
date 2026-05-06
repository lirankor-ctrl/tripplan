'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight, Hotel, Restaurant, Event, Trip } from '@/lib/types';
import { flightsStorage, hotelsStorage, restaurantsStorage, eventsStorage, tripsStorage } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { printWithMode } from '@/lib/print';
import { TripCalendar } from '@/components/calendar/TripCalendar';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Printer } from 'lucide-react';

export default function CalendarPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [t, f, h, r, e] = await Promise.all([
          tripsStorage.getById(id),
          flightsStorage.getByTrip(id),
          hotelsStorage.getByTrip(id),
          restaurantsStorage.getByTrip(id),
          eventsStorage.getByTrip(id),
        ]);
        if (cancelled) return;
        setTrip(t ?? null); setFlights(f); setHotels(h); setRestaurants(r); setEvents(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="p-4 md:p-6" dir="rtl">
      {/* On-screen header with the print button. */}
      <div className="flex items-center justify-between gap-2 mb-5 no-print">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">לוח שנה</h1>
        <Button variant="secondary" size="sm" onClick={() => printWithMode('calendar')} className="flex-shrink-0" aria-label="הדפס לוח שנה">
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">הדפס לוח שנה</span>
        </Button>
      </div>

      {/* Print-only header — gives the printed page the trip name + dates. */}
      {trip && (
        <div className="print-only mb-4 pb-3 border-b border-gray-300 text-center" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{trip.name}</h1>
          {(trip.startDate || trip.endDate) && (
            <p className="text-sm text-gray-600">
              {formatDate(trip.startDate)}
              {trip.startDate && trip.endDate && ' — '}
              {formatDate(trip.endDate)}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <TripCalendar
          flights={flights}
          hotels={hotels}
          restaurants={restaurants}
          events={events}
        />
      )}
    </div>
  );
}
