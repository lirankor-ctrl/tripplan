'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trip, Flight, Hotel, Restaurant, Event, PackingItem, TripNote } from '@/lib/types';
import {
  tripsStorage, flightsStorage, hotelsStorage,
  restaurantsStorage, eventsStorage, packingStorage, notesStorage,
} from '@/lib/storage';
import { formatDate, sortFlightsForDisplay } from '@/lib/utils';
import { TripCalendar } from '@/components/calendar/TripCalendar';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { printWithMode } from '@/lib/print';
import { TRANSPORT_ICONS, transportTypeOf } from '@/lib/transport';
import {
  Plane, Hotel as HotelIcon, UtensilsCrossed,
  Music, Package, FileText, MapPin, Calendar, Check,
} from 'lucide-react';

function SectionTitle({ icon: Icon, title, colorClass }: {
  icon: React.ElementType;
  title: string;
  colorClass: string;
}) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${colorClass}`}>
      <Icon className="w-5 h-5" />
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
}

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [packing, setPacking] = useState<PackingItem[]>([]);
  const [notes, setNotes] = useState<TripNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [t, f, h, r, e, p, n] = await Promise.all([
          tripsStorage.getById(id),
          flightsStorage.getByTrip(id),
          hotelsStorage.getByTrip(id),
          restaurantsStorage.getByTrip(id),
          eventsStorage.getByTrip(id),
          packingStorage.getByTrip(id),
          notesStorage.getByTrip(id),
        ]);
        if (cancelled) return;
        setTrip(t ?? null);
        setFlights(f);
        setHotels(h);
        setRestaurants(r);
        setEvents(e);
        setPacking(p);
        setNotes(n ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingState />;
  if (!trip) return null;

  return (
    <div dir="rtl">
      {/* Screen-only controls */}
      <div className="p-4 md:p-6 no-print border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">ייצוא והדפסה</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
              בחר את הפורמט הרצוי — סיכום טקסטואלי או לוח שנה חזותי
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button variant="secondary" onClick={() => printWithMode('summary')} size="md" aria-label="הדפס סיכום טקסטואלי">
              <FileText className="w-4 h-4" />
              <span>הדפס סיכום טקסטואלי</span>
            </Button>
            <Button onClick={() => printWithMode('calendar')} size="md" aria-label="הדפס לוח שנה חזותי">
              <Calendar className="w-4 h-4" />
              <span>הדפס לוח שנה חזותי</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable content. The two top-level wrappers are tagged with
          data-print-target so globals.css can show one and hide the other
          based on the body class set by printWithMode(). */}
      <div className="px-4 md:px-8 pb-12 max-w-4xl mx-auto">

        {/* Trip header — visible in BOTH print modes (no data-print-target). */}
        <div className="text-center py-8 mb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.name}</h1>
          {trip.destination && (
            <div className="flex items-center justify-center gap-1.5 text-lg text-gray-600 mb-1">
              <MapPin className="w-5 h-5" />
              {trip.destination}
            </div>
          )}
          {(trip.startDate || trip.endDate) && (
            <p className="text-gray-500">
              {formatDate(trip.startDate)}
              {trip.startDate && trip.endDate && ' — '}
              {formatDate(trip.endDate)}
            </p>
          )}
        </div>

        {/* Textual summary — hidden when printing the visual calendar. */}
        <div data-print-target="summary">

        {/* Transportation — single chronological list, dateless first. */}
        {flights.length > 0 && (
          <section className="mb-8">
            <SectionTitle icon={Plane} title="טיסות / העברות" colorClass="border-blue-400 text-blue-700" />
            <div className="space-y-2">
              {sortFlightsForDisplay(flights).map(f => {
                // Static lookup keeps the static-components lint rule happy.
                const Icon = TRANSPORT_ICONS[transportTypeOf(f.transportType)];
                return (
                  <div key={f.id} className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 rounded-xl text-sm">
                    <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="font-bold text-blue-800">
                      {f.departureAirport || '—'} → {f.arrivalAirport || '—'}
                    </span>
                    {f.airline && <span className="text-gray-600">{f.airline}</span>}
                    {f.departureDate && (
                      <span className="text-gray-600">{formatDate(f.departureDate)}{f.departureTime ? ` ${f.departureTime}` : ''}</span>
                    )}
                    {f.price && <span className="text-green-600 font-semibold mr-auto">₪{f.price}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hotels */}
        {hotels.length > 0 && (
          <section className="mb-8">
            <SectionTitle icon={HotelIcon} title="מלונות" colorClass="border-purple-400 text-purple-700" />
            <div className="space-y-2">
              {hotels.map(h => (
                <div key={h.id} className="p-3 bg-purple-50 rounded-xl text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-purple-800">
                      {h.hotelName || 'מלון'}
                      {h.city && ` — ${h.city}`}
                    </span>
                    {h.price && <span className="text-green-600 font-semibold">₪{h.price}</span>}
                  </div>
                  {(h.arrivalDate || h.departureDate) && (
                    <p className="text-gray-600 mt-1">
                      {formatDate(h.arrivalDate)} — {formatDate(h.departureDate)}
                    </p>
                  )}
                  {h.notes && <p className="text-gray-500 mt-1 text-xs">{h.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Restaurants */}
        {restaurants.length > 0 && (
          <section className="mb-8">
            <SectionTitle icon={UtensilsCrossed} title="מסעדות" colorClass="border-green-400 text-green-700" />
            <div className="space-y-2">
              {restaurants.map(r => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 p-3 bg-green-50 rounded-xl text-sm">
                  <span className="font-bold text-green-800">{r.name}</span>
                  {r.city && <span className="text-gray-500">{r.city}</span>}
                  {r.date && <span className="text-gray-600">{formatDate(r.date)}{r.time ? ` · ${r.time}` : ''}</span>}
                  {r.location && <span className="text-gray-500 text-xs">{r.location}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section className="mb-8">
            <SectionTitle icon={Music} title="אירועים והופעות" colorClass="border-orange-400 text-orange-700" />
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 p-3 bg-orange-50 rounded-xl text-sm">
                  <span className="font-bold text-orange-800">{e.name}</span>
                  {e.city && <span className="text-gray-500">{e.city}</span>}
                  {e.date && <span className="text-gray-600">{formatDate(e.date)}{e.time ? ` · ${e.time}` : ''}</span>}
                  {e.location && <span className="text-gray-500 text-xs">{e.location}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Packing */}
        {packing.length > 0 && (
          <section className="mb-8">
            <SectionTitle icon={Package} title="רשימת אריזה" colorClass="border-yellow-400 text-yellow-700" />
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              {packing.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    item.isDone ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {item.isDone && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={item.isDone ? 'line-through text-gray-400' : 'text-gray-700'}>
                    {item.name}
                  </span>
                  {item.category && <span className="text-gray-400 text-xs">({item.category})</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {notes?.content && (
          <section className="mb-8">
            <SectionTitle icon={FileText} title="הערות" colorClass="border-gray-300 text-gray-600" />
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-7">
              {notes.content}
            </div>
          </section>
        )}

        </div>{/* /data-print-target="summary" */}

        {/* Visual calendar — hidden when printing the textual summary. */}
        <section data-print-target="calendar" className="mb-8">
          <SectionTitle icon={Calendar} title="לוח שנה" colorClass="border-indigo-400 text-indigo-700" />
          <TripCalendar
            flights={flights}
            hotels={hotels}
            restaurants={restaurants}
            events={events}
            printMode
          />
        </section>

      </div>
    </div>
  );
}
