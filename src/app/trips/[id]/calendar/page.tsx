'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flight, Hotel, Restaurant, Event } from '@/lib/types';
import { flightsStorage, hotelsStorage, restaurantsStorage, eventsStorage } from '@/lib/storage';
import { TripCalendar } from '@/components/calendar/TripCalendar';
import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

export default function CalendarPage() {
  const { id } = useParams<{ id: string }>();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [f, h, r, e] = await Promise.all([
        flightsStorage.getByTrip(id),
        hotelsStorage.getByTrip(id),
        restaurantsStorage.getByTrip(id),
        eventsStorage.getByTrip(id),
      ]);
      if (cancelled) return;
      setFlights(f); setHotels(h); setRestaurants(r); setEvents(e);
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">לוח שנה</h1>
        <Button variant="secondary" size="sm" onClick={() => window.print()} className="no-print flex-shrink-0" aria-label="הדפס לוח שנה">
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">הדפס לוח שנה</span>
        </Button>
      </div>

      <TripCalendar
        flights={flights}
        hotels={hotels}
        restaurants={restaurants}
        events={events}
      />
    </div>
  );
}
