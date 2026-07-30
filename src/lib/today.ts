// Pure aggregation helpers for the "Today in My Trip" dashboard. Mirrors the
// multi-module aggregation pattern from TripCalendar.tsx's buildCalendarEvents,
// scoped to a single day. No storage access here — callers pass in data
// already fetched via the existing storage layer.

import { ActivityType, Event, Flight, Hotel, Restaurant, TransportType, TripDocument, DocumentCategory } from './types';

export type TimelineCategory = 'flight' | 'hotel-checkin' | 'hotel-checkout' | 'restaurant' | 'activity';

export interface TimelineItem {
  id: string;
  time?: string;
  category: TimelineCategory;
  transportType?: TransportType;
  activityType?: ActivityType;
  title: string;
  subtitle?: string;
}

// Hotels have no time field (only arrivalDate/departureDate) — check-in and
// check-out always come back with time: undefined, so they land in the
// caller's "Any Time Today" bucket rather than a fabricated hour.
export function buildDayTimeline(
  dateStr: string,
  flights: Flight[],
  hotels: Hotel[],
  restaurants: Restaurant[],
  events: Event[],
): TimelineItem[] {
  const items: TimelineItem[] = [];

  flights.forEach(f => {
    if (f.departureDate !== dateStr) return;
    items.push({
      id: `${f.id}_dep`,
      time: f.departureTime || undefined,
      category: 'flight',
      transportType: f.transportType,
      title: [f.departureAirport, f.arrivalAirport].filter(Boolean).join(' → ') || 'נסיעה',
      subtitle: f.airline || undefined,
    });
  });

  hotels.forEach(h => {
    if (h.arrivalDate === dateStr) {
      items.push({
        id: `${h.id}_checkin`,
        category: 'hotel-checkin',
        title: h.hotelName ? `צ'ק אין: ${h.hotelName}` : "צ'ק אין למלון",
        subtitle: h.city || undefined,
      });
    }
    if (h.departureDate === dateStr) {
      items.push({
        id: `${h.id}_checkout`,
        category: 'hotel-checkout',
        title: h.hotelName ? `צ'ק אאוט: ${h.hotelName}` : "צ'ק אאוט ממלון",
        subtitle: h.city || undefined,
      });
    }
  });

  restaurants.forEach(r => {
    if (r.date !== dateStr) return;
    items.push({
      id: r.id,
      time: r.time || undefined,
      category: 'restaurant',
      title: r.name,
      subtitle: [r.city, r.location].filter(Boolean).join(' · ') || undefined,
    });
  });

  events.forEach(e => {
    if (e.date !== dateStr) return;
    items.push({
      id: e.id,
      time: e.time || undefined,
      category: 'activity',
      activityType: e.activityType,
      title: e.name,
      subtitle: [e.city, e.location].filter(Boolean).join(' · ') || undefined,
    });
  });

  return items;
}

// Sum of price fields for flights/hotels touching this date (departure day
// for flights, check-in day for hotels) — same derivation the Expenses page
// already does from these two fields, just scoped to one day.
export function sumTodayCost(dateStr: string, flights: Flight[], hotels: Hotel[]): number {
  let total = 0;
  flights.forEach(f => {
    if (f.departureDate === dateStr && f.price) total += parseFloat(f.price) || 0;
  });
  hotels.forEach(h => {
    if (h.arrivalDate === dateStr && h.price) total += parseFloat(h.price) || 0;
  });
  return total;
}

export interface PrepItem {
  id: string;
  text: string;
  category: TimelineCategory | 'document';
  transportType?: TransportType;
  activityType?: ActivityType;
}

// Categories relevant to a travel day, inferred purely from what's already
// scheduled that day — never invented. Passport/insurance/visa are treated as
// generally relevant on any day that has a flight or hotel check-in.
function relevantDocumentCategories(dayItems: TimelineItem[]): Set<DocumentCategory> {
  const cats = new Set<DocumentCategory>();
  dayItems.forEach(item => {
    if (item.category === 'flight') cats.add('flight_ticket');
    if (item.category === 'hotel-checkin') cats.add('hotel_booking');
    if (item.category === 'activity') cats.add('event_ticket');
  });
  if (cats.size > 0) {
    cats.add('passport');
    cats.add('visa');
    cats.add('insurance');
  }
  return cats;
}

export function buildTomorrowPrep(
  dateStr: string,
  flights: Flight[],
  hotels: Hotel[],
  restaurants: Restaurant[],
  events: Event[],
  documents: TripDocument[],
): PrepItem[] {
  const dayItems = buildDayTimeline(dateStr, flights, hotels, restaurants, events);
  const items: PrepItem[] = [];

  dayItems.forEach(item => {
    switch (item.category) {
      case 'flight':
        items.push({
          id: item.id,
          category: 'flight',
          transportType: item.transportType,
          text: item.time ? `טיסה מחר ב-${item.time}: ${item.title}` : `טיסה מחר: ${item.title}`,
        });
        break;
      case 'hotel-checkin':
        items.push({ id: item.id, category: 'hotel-checkin', text: `${item.title} מחר` });
        break;
      case 'hotel-checkout':
        items.push({ id: item.id, category: 'hotel-checkout', text: `${item.title} מחר` });
        break;
      case 'restaurant':
        items.push({
          id: item.id,
          category: 'restaurant',
          text: item.time ? `הזמנה במסעדה ${item.title} מחר ב-${item.time}` : `הזמנה במסעדה ${item.title} מחר`,
        });
        break;
      case 'activity':
        items.push({
          id: item.id,
          category: 'activity',
          activityType: item.activityType,
          text: item.time ? `${item.title} מחר ב-${item.time}` : `${item.title} מחר`,
        });
        break;
    }
  });

  const relevantCats = relevantDocumentCategories(dayItems);
  documents
    .filter(d => relevantCats.has(d.category))
    .forEach(d => {
      items.push({ id: `doc_${d.id}`, category: 'document', text: `אל תשכחו: ${d.name}` });
    });

  return items;
}
