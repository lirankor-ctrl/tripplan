'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trip, Flight, Hotel, Restaurant, Event, TripDocument } from '@/lib/types';
import {
  tripsStorage, flightsStorage, hotelsStorage,
  restaurantsStorage, eventsStorage, documentsStorage,
} from '@/lib/storage';
import { buildDayTimeline, buildTomorrowPrep, sumTodayCost, TimelineItem, TimelineCategory } from '@/lib/today';
import { CATEGORY_COLORS, cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardBody } from '@/components/ui/Card';
import { TRANSPORT_ICONS, transportTypeOf } from '@/lib/transport';
import { Sun, Hotel as HotelIcon, UtensilsCrossed, Music, FileText, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Partial<Record<TimelineCategory, LucideIcon>> = {
  'hotel-checkin': HotelIcon,
  'hotel-checkout': HotelIcon,
  restaurant: UtensilsCrossed,
  activity: Music,
};

const PREP_EMOJI: Record<string, string> = {
  flight: '✈️',
  'hotel-checkin': '🏨',
  'hotel-checkout': '🏨',
  restaurant: '🍽️',
  activity: '🎯',
  document: '📄',
};

function colorKeyFor(category: TimelineCategory): keyof typeof CATEGORY_COLORS {
  if (category === 'flight') return 'flight';
  if (category === 'hotel-checkin' || category === 'hotel-checkout') return 'hotel';
  if (category === 'restaurant') return 'restaurant';
  return 'event';
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const colors = CATEGORY_COLORS[colorKeyFor(item.category)];
  const Icon = item.category === 'flight'
    ? TRANSPORT_ICONS[transportTypeOf(item.transportType)]
    : CATEGORY_ICONS[item.category]!;
  return (
    <Card>
      <CardBody className="p-3.5 flex items-center gap-3" dir="rtl">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{item.title}</div>
          {item.subtitle && <div className="text-xs text-gray-400 truncate">{item.subtitle}</div>}
        </div>
        {item.time && (
          <span className={cn('text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0', colors.bg, colors.text)}>
            {item.time}
          </span>
        )}
      </CardBody>
    </Card>
  );
}

export default function TodayPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [t, f, h, r, e, d] = await Promise.all([
          tripsStorage.getById(id),
          flightsStorage.getByTrip(id),
          hotelsStorage.getByTrip(id),
          restaurantsStorage.getByTrip(id),
          eventsStorage.getByTrip(id),
          documentsStorage.getByTrip(id),
        ]);
        if (cancelled) return;
        setTrip(t ?? null);
        setFlights(f);
        setHotels(h);
        setRestaurants(r);
        setEvents(e);
        setDocuments(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Stamped once per mount — the page always reflects the moment it was
  // opened, same "browser local time" convention the rest of the app uses.
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const tomorrowStr = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const todayLabel = useMemo(
    () => `${format(new Date(), 'EEEE', { locale: he })}, ${format(new Date(), 'd בMMMM', { locale: he })}`,
    [],
  );

  const todayItems = useMemo(
    () => buildDayTimeline(todayStr, flights, hotels, restaurants, events),
    [todayStr, flights, hotels, restaurants, events],
  );
  const timedItems = useMemo(
    () => todayItems.filter(i => i.time).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [todayItems],
  );
  const untimedItems = useMemo(() => todayItems.filter(i => !i.time), [todayItems]);
  const todayCost = useMemo(() => sumTodayCost(todayStr, flights, hotels), [todayStr, flights, hotels]);
  const tomorrowItems = useMemo(
    () => buildTomorrowPrep(tomorrowStr, flights, hotels, restaurants, events, documents),
    [tomorrowStr, flights, hotels, restaurants, events, documents],
  );

  if (loading) return <LoadingState />;
  if (!trip) return null;

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sun className="w-6 h-6 text-amber-500" />
          היום בטיול
        </h1>
        <p className="text-sm text-gray-400 mt-1">{todayLabel}</p>
      </div>

      {todayItems.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="אין תוכניות מיוחדות להיום"
          description="תיהנו מהיום החופשי! 🌞"
        />
      ) : (
        <div className="space-y-6">
          {timedItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">לוח זמנים להיום</h2>
              <div className="space-y-2.5">
                {timedItems.map(item => <TimelineRow key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {untimedItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">בכל שעה היום</h2>
              <div className="space-y-2.5">
                {untimedItems.map(item => <TimelineRow key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {todayCost > 0 && (
            <p className="text-sm font-semibold text-green-600">
              💰 עלות היום: ₪{todayCost.toLocaleString('he-IL')}
            </p>
          )}
        </div>
      )}

      {tomorrowItems.length > 0 && (
        <Card className="mt-8">
          <CardBody className="p-5" dir="rtl">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              מחר
            </h2>
            <ul className="space-y-2">
              {tomorrowItems.map(item => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 flex-shrink-0">{PREP_EMOJI[item.category]}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
