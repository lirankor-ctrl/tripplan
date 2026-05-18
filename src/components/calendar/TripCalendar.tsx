'use client';
import { useMemo, useState } from 'react';
import { Flight, Hotel, Restaurant, Event, CalendarEvent, TransportType } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/utils';
import {
  format, parseISO, eachDayOfInterval, isValid, isToday,
  getDay, subDays, addDays,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Plane, Hotel as HotelIcon, UtensilsCrossed, Music, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TRANSPORT_ICONS } from '@/lib/transport';
import { transportTypeOf } from '@/lib/transport';

// Sunday-first, matching getDay() indices 0–6
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Default per-section icons. Transport rows look up their icon via
// TRANSPORT_ICONS based on CalendarEvent.transportType — kept as a static
// property lookup (not a function call) so the static-components lint rule
// accepts it inside the render path.
const CATEGORY_ICONS = {
  flight: Plane,
  hotel: HotelIcon,
  restaurant: UtensilsCrossed,
  event: Music,
  note: Calendar,
};

const CATEGORY_LABELS: Record<string, string> = {
  flight: 'טיסות',
  hotel: 'מלונות',
  restaurant: 'מסעדות',
  event: 'אירועים',
  note: 'הערות',
};

function buildCalendarEvents(
  flights: Flight[],
  hotels: Hotel[],
  restaurants: Restaurant[],
  events: Event[],
): CalendarEvent[] {
  const items: CalendarEvent[] = [];

  flights.forEach(f => {
    if (f.departureDate) {
      const tt: TransportType = transportTypeOf(f.transportType);
      items.push({
        id: `${f.id}_dep`,
        date: f.departureDate,
        title: [f.departureAirport, f.arrivalAirport].filter(Boolean).join(' → ') || 'נסיעה',
        type: 'flight',
        transportType: tt,
        time: f.departureTime || undefined,
        details: f.airline || undefined,
        sourceId: f.id,
      });
    }
  });

  hotels.forEach(h => {
    if (!h.arrivalDate) return;
    const stayStart = parseISO(h.arrivalDate);
    const stayEnd = h.departureDate ? parseISO(h.departureDate) : stayStart;
    if (!isValid(stayStart) || !isValid(stayEnd) || stayEnd < stayStart) return;

    eachDayOfInterval({ start: stayStart, end: stayEnd }).forEach((day, i) => {
      items.push({
        id: `${h.id}_stay_${i}`,
        date: format(day, 'yyyy-MM-dd'),
        title: h.hotelName ? `מלון: ${h.hotelName}` : 'מלון',
        type: 'hotel',
        details: h.city || undefined,
        sourceId: h.id,
      });
    });
  });

  restaurants.forEach(r => {
    if (r.date) {
      items.push({
        id: r.id,
        date: r.date,
        title: r.name,
        type: 'restaurant',
        time: r.time || undefined,
        details: [r.city, r.location].filter(Boolean).join(' · ') || undefined,
        sourceId: r.id,
      });
    }
  });

  events.forEach(e => {
    if (e.date) {
      items.push({
        id: e.id,
        date: e.date,
        title: e.name,
        type: 'event',
        time: e.time || undefined,
        details: [e.city, e.location].filter(Boolean).join(' · ') || undefined,
        sourceId: e.id,
      });
    }
  });

  // Final-defense dedup: even if storage returned duplicates, never render
  // two chips for the same id, or for items with identical content.
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const deduped: CalendarEvent[] = [];
  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    const contentKey = [item.type, item.date, item.time || '', item.title, item.details || ''].join('|');
    if (seenContent.has(contentKey)) continue;
    seenContent.add(contentKey);
    deduped.push(item);
  }

  return deduped.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });
}

function getFlightDateRange(flights: Flight[]): { start: Date; end: Date } | null {
  const dates = flights
    .map(f => f.departureDate)
    .filter(Boolean)
    .map(d => parseISO(d))
    .filter(isValid);

  if (dates.length === 0) return null;

  const timestamps = dates.map(d => d.getTime());
  return {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  };
}

type GridDay = { day: Date; inRange: boolean };

// Pad the trip range outward to full Sun–Sat weeks
function buildWeeklyGrid(start: Date, end: Date): GridDay[] {
  const paddedStart = subDays(start, getDay(start));          // back to Sunday
  const paddedEnd = addDays(end, 6 - getDay(end));            // forward to Saturday

  return eachDayOfInterval({ start: paddedStart, end: paddedEnd }).map(day => ({
    day,
    inRange: day >= start && day <= end,
  }));
}

interface CalendarProps {
  flights: Flight[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  events: Event[];
  printMode?: boolean;
}

function EventChip({ evt, onClick }: { evt: CalendarEvent; onClick?: () => void }) {
  const colors = CATEGORY_COLORS[evt.type];
  const Icon = evt.type === 'flight'
    ? TRANSPORT_ICONS[transportTypeOf(evt.transportType)]
    : CATEGORY_ICONS[evt.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-right rounded-md px-1.5 py-0.5 text-xs flex items-start gap-1 leading-snug',
        colors.bg, colors.text,
        onClick && 'hover:opacity-80 transition-opacity',
      )}
    >
      <Icon className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
      <span className="truncate">
        {evt.time && <span className="font-semibold">{evt.time} </span>}
        {evt.title}
      </span>
    </button>
  );
}

export function TripCalendar({ flights, hotels, restaurants, events, printMode }: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const calendarEvents = useMemo(
    () => buildCalendarEvents(flights, hotels, restaurants, events),
    [flights, hotels, restaurants, events],
  );

  const dateRange = useMemo(() => getFlightDateRange(flights), [flights]);

  const gridDays = useMemo(
    () => (dateRange ? buildWeeklyGrid(dateRange.start, dateRange.end) : []),
    [dateRange],
  );

  // Chunk into 7-day weeks so each row can carry `break-inside: avoid` and
  // never get split across two printed pages.
  const weeks = useMemo(() => {
    const out: GridDay[][] = [];
    for (let i = 0; i < gridDays.length; i += 7) out.push(gridDays.slice(i, i + 7));
    return out;
  }, [gridDays]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    calendarEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [calendarEvents]);

  if (!dateRange) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Plane className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-gray-700 font-semibold mb-1">אין טיסות או העברות עדיין</p>
        <p className="text-sm text-gray-400 max-w-xs">
          כדי להציג את לוח השנה, הוסף קודם לפחות נסיעה אחת עם תאריך
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Desktop / Print grid — always visible when printing, regardless of viewport. */}
      <div className={cn(printMode ? 'block' : 'hidden md:block print:block')}>
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAY_NAMES.map(name => (
            <div key={name} className="text-center text-xs font-semibold text-gray-400 py-1 tracking-wide">
              {name}
            </div>
          ))}
        </div>

        {/* Week rows — each row keeps its 7 cells together when printing. */}
        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 calendar-week">
              {week.map(({ day, inRange }) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateStr] ?? [];
                const today = isToday(day);
                const active = today && inRange;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'calendar-day min-h-[110px] rounded-xl border overflow-hidden transition-opacity',
                      inRange ? 'bg-white' : 'bg-gray-50 opacity-35',
                      active ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100',
                    )}
                  >
                    {/* Date header */}
                    <div className={cn(
                      'px-2 py-1 text-center border-b',
                      active ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-100',
                    )}>
                      <div className={cn(
                        'text-base font-bold leading-tight',
                        active ? 'text-white' : inRange ? 'text-gray-800' : 'text-gray-300',
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className={cn(
                        'text-xs',
                        active ? 'text-indigo-200' : 'text-gray-400',
                      )}>
                        {format(day, 'MMM', { locale: he })}
                      </div>
                    </div>

                    {/* Events (only for in-range days) */}
                    {inRange && (
                      <div className="p-1 space-y-0.5">
                        {dayEvents.map(evt => (
                          <EventChip
                            key={evt.id}
                            evt={evt}
                            onClick={printMode ? undefined : () => setSelectedEvent(evt)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical list (in-range days only) — hidden when printing. */}
      {!printMode && (
        <div className="md:hidden print:hidden space-y-2">
          {gridDays.filter(d => d.inRange).map(({ day }) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateStr] ?? [];
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className={cn(
                  'rounded-xl border bg-white overflow-hidden',
                  today ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100',
                  dayEvents.length === 0 && 'opacity-50',
                )}
              >
                <div className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  today ? 'bg-indigo-600' : 'bg-gray-50',
                )}>
                  <div className={cn('text-center min-w-[2rem]', today ? 'text-white' : 'text-gray-700')}>
                    <div className="text-xs opacity-75">{DAY_NAMES[getDay(day)]}</div>
                    <div className="text-xl font-bold leading-tight">{format(day, 'd')}</div>
                  </div>
                  <div className={cn('text-xs', today ? 'text-indigo-200' : 'text-gray-400')}>
                    {format(day, 'MMMM', { locale: he })}
                  </div>
                  {dayEvents.length > 0 && (
                    <span className={cn(
                      'mr-auto text-xs font-medium px-2 py-0.5 rounded-full',
                      today ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600',
                    )}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="px-3 py-2 space-y-1.5">
                    {dayEvents.map(evt => {
                      const colors = CATEGORY_COLORS[evt.type];
                      const Icon = evt.type === 'flight'
                        ? TRANSPORT_ICONS[transportTypeOf(evt.transportType)]
                        : CATEGORY_ICONS[evt.type];
                      return (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={cn(
                            'w-full flex items-center gap-2 text-right rounded-lg px-3 py-2 text-sm',
                            colors.bg, colors.text, 'hover:opacity-80 transition-opacity',
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{evt.title}</div>
                            {(evt.time || evt.details) && (
                              <div className={cn('text-xs opacity-75 truncate', colors.text)}>
                                {[evt.time, evt.details].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-end">
        {(Object.entries(CATEGORY_COLORS) as [string, typeof CATEGORY_COLORS.flight][]).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
            {CATEGORY_LABELS[type]}
          </div>
        ))}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <Modal
          isOpen
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          size="sm"
        >
          <div className="space-y-3 text-sm" dir="rtl">
            {selectedEvent.time && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium text-gray-500">שעה:</span>
                <span>{selectedEvent.time}</span>
              </div>
            )}
            {selectedEvent.details && (
              <div className="flex items-start gap-2 text-gray-600">
                <span className="font-medium text-gray-500">פרטים:</span>
                <span>{selectedEvent.details}</span>
              </div>
            )}
            <div className="pt-1">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                CATEGORY_COLORS[selectedEvent.type].bg,
                CATEGORY_COLORS[selectedEvent.type].text,
              )}>
                {CATEGORY_LABELS[selectedEvent.type]}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
