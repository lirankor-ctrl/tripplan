// Hybrid storage layer.
//
// Routing rule: if Supabase is configured AND a user is currently signed in,
// every operation goes to Postgres. Otherwise we fall back to the existing
// browser-localStorage behaviour, so the app keeps working without env vars.
//
// All public functions are async — the previous synchronous shape couldn't
// represent network calls. Pages await them and show a small loading state.

import { Trip, Flight, Hotel, Restaurant, Event, PackingItem, Photo, TripNote } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseBrowser } from './supabase/client';
import { isSupabaseConfigured } from './supabase/config';

export type BackupData = {
  version: number;
  exportedAt: string;
  data: {
    trips: Trip[];
    flights: Flight[];
    hotels: Hotel[];
    restaurants: Restaurant[];
    events: Event[];
    packingItems: PackingItem[];
    photos: Photo[];
    notes: TripNote[];
  };
};

const KEYS = {
  trips: 'tripplan_trips',
  flights: 'tripplan_flights',
  hotels: 'tripplan_hotels',
  restaurants: 'tripplan_restaurants',
  events: 'tripplan_events',
  packingItems: 'tripplan_packing',
  photos: 'tripplan_photos',
  notes: 'tripplan_notes',
};

// ---------- Mode detection ----------

// We need the *user* to be signed in, not just env vars to be present.
// getSession is local (no network) — fast enough to call per-request.
async function getActiveUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// ---------- localStorage helpers (unchanged from the old implementation) ----------

function deduplicateItems<T extends { id: string }>(items: T[]): T[] {
  const seenIds = new Set<string>();
  const idDeduped = items.filter(item => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  const seenContent = new Set<string>();
  return idDeduped.filter(item => {
    const entries = Object.entries(item as Record<string, unknown>).filter(([k]) => k !== 'id');
    entries.sort(([a], [b]) => a.localeCompare(b));
    const contentKey = JSON.stringify(entries);
    if (seenContent.has(contentKey)) return false;
    seenContent.add(contentKey);
    return true;
  });
}

function lsGetAll<T extends { id: string }>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const items: T[] = raw ? JSON.parse(raw) : [];
    const deduped = deduplicateItems(items);
    if (deduped.length !== items.length) localStorage.setItem(key, JSON.stringify(deduped));
    return deduped;
  } catch {
    return [];
  }
}

function lsSaveAll<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

// ---------- Row mapping (snake_case <-> camelCase) ----------
// Keep the app-level shape camelCase so the components don't all need to change.

type TripRow = {
  id: string; user_id: string; name: string; destination: string | null;
  start_date: string | null; end_date: string | null; cover_image: string | null;
  created_at: string; updated_at: string;
};
const tripFromRow = (r: TripRow): Trip => ({
  id: r.id, name: r.name, destination: r.destination ?? '',
  startDate: r.start_date ?? '', endDate: r.end_date ?? '',
  coverImage: r.cover_image ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

type FlightRow = {
  id: string; user_id: string; trip_id: string; type: 'international' | 'internal';
  airline: string | null; departure_airport: string | null; arrival_airport: string | null;
  departure_date: string | null; departure_time: string | null; price: string | null;
};
const flightFromRow = (r: FlightRow): Flight => ({
  id: r.id, tripId: r.trip_id, type: r.type,
  airline: r.airline ?? '', departureAirport: r.departure_airport ?? '',
  arrivalAirport: r.arrival_airport ?? '', departureDate: r.departure_date ?? '',
  departureTime: r.departure_time ?? '', price: r.price ?? undefined,
});

type HotelRow = {
  id: string; user_id: string; trip_id: string; city: string | null; hotel_name: string | null;
  arrival_date: string | null; departure_date: string | null; notes: string | null; price: string | null;
};
const hotelFromRow = (r: HotelRow): Hotel => ({
  id: r.id, tripId: r.trip_id, city: r.city ?? '', hotelName: r.hotel_name ?? '',
  arrivalDate: r.arrival_date ?? '', departureDate: r.departure_date ?? '',
  notes: r.notes ?? undefined, price: r.price ?? undefined,
});

type RestaurantRow = {
  id: string; user_id: string; trip_id: string; city: string | null; name: string;
  date: string | null; time: string | null; location: string | null;
  notes: string | null; image_url: string | null;
};
const restaurantFromRow = (r: RestaurantRow): Restaurant => ({
  id: r.id, tripId: r.trip_id, city: r.city ?? '', name: r.name,
  date: r.date ?? '', time: r.time ?? '',
  location: r.location ?? undefined, notes: r.notes ?? undefined, imageUrl: r.image_url ?? undefined,
});

type EventRow = RestaurantRow;
const eventFromRow = (r: EventRow): Event => ({
  id: r.id, tripId: r.trip_id, city: r.city ?? '', name: r.name,
  date: r.date ?? '', time: r.time ?? '',
  location: r.location ?? undefined, notes: r.notes ?? undefined, imageUrl: r.image_url ?? undefined,
});

type PackingRow = {
  id: string; user_id: string; trip_id: string; name: string;
  category: string | null; is_done: boolean;
};
const packingFromRow = (r: PackingRow): PackingItem => ({
  id: r.id, tripId: r.trip_id, name: r.name,
  category: r.category ?? undefined, isDone: r.is_done,
});

type PhotoRow = {
  id: string; user_id: string; trip_id: string; image_url: string;
  caption: string | null; created_at: string;
};
const photoFromRow = (r: PhotoRow): Photo => ({
  id: r.id, tripId: r.trip_id, imageUrl: r.image_url,
  caption: r.caption ?? undefined, createdAt: r.created_at,
});

type NoteRow = { id: string; user_id: string; trip_id: string; content: string; updated_at: string };
const noteFromRow = (r: NoteRow): TripNote => ({
  id: r.id, tripId: r.trip_id, content: r.content, updatedAt: r.updated_at,
});

// ---------- Trips ----------

export const tripsStorage = {
  async getAll(): Promise<Trip[]> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data, error } = await supabase
        .from('trips').select('*').order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data as TripRow[]).map(tripFromRow);
    }
    return lsGetAll<Trip>(KEYS.trips);
  },

  async getById(id: string): Promise<Trip | undefined> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data, error } = await supabase
        .from('trips').select('*').eq('id', id).maybeSingle();
      if (error || !data) return undefined;
      return tripFromRow(data as TripRow);
    }
    return lsGetAll<Trip>(KEYS.trips).find(t => t.id === id);
  },

  async create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data: row, error } = await supabase.from('trips').insert({
        user_id: userId,
        name: data.name,
        destination: data.destination || null,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        cover_image: data.coverImage || null,
      }).select().single();
      if (error) throw error;
      return tripFromRow(row as TripRow);
    }
    const trip: Trip = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    lsSaveAll(KEYS.trips, [...lsGetAll<Trip>(KEYS.trips), trip]);
    return trip;
  },

  async update(id: string, data: Partial<Trip>): Promise<Trip | undefined> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const patch: Record<string, unknown> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.destination !== undefined) patch.destination = data.destination || null;
      if (data.startDate !== undefined) patch.start_date = data.startDate || null;
      if (data.endDate !== undefined) patch.end_date = data.endDate || null;
      if (data.coverImage !== undefined) patch.cover_image = data.coverImage || null;
      const { data: row, error } = await supabase.from('trips').update(patch).eq('id', id).select().single();
      if (error || !row) return undefined;
      return tripFromRow(row as TripRow);
    }
    const trips = lsGetAll<Trip>(KEYS.trips);
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    trips[idx] = { ...trips[idx], ...data, updatedAt: new Date().toISOString() };
    lsSaveAll(KEYS.trips, trips);
    return trips[idx];
  },

  async delete(id: string): Promise<void> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      // Cascade is configured at the DB level via on delete cascade.
      await supabase.from('trips').delete().eq('id', id);
      return;
    }
    lsSaveAll(KEYS.trips, lsGetAll<Trip>(KEYS.trips).filter(t => t.id !== id));
    await flightsStorage.deleteByTrip(id);
    await hotelsStorage.deleteByTrip(id);
    await restaurantsStorage.deleteByTrip(id);
    await eventsStorage.deleteByTrip(id);
    await packingStorage.deleteByTrip(id);
    await photosStorage.deleteByTrip(id);
    await notesStorage.deleteByTrip(id);
  },
};

// ---------- Generic factory for the simple per-trip child tables ----------

type ChildOps<T extends { id: string; tripId: string }, Insert> = {
  table: string;
  toRowInsert: (data: Insert, userId: string) => Record<string, unknown>;
  toRowUpdate: (data: Partial<T>) => Record<string, unknown>;
  fromRow: (row: any) => T; // eslint-disable-line @typescript-eslint/no-explicit-any
  lsKey: string;
};

function makeChildStorage<T extends { id: string; tripId: string }, Insert extends { tripId: string }>(
  ops: ChildOps<T, Insert>,
) {
  return {
    async getByTrip(tripId: string): Promise<T[]> {
      const userId = await getActiveUserId();
      if (userId) {
        const supabase = getSupabaseBrowser()!;
        const { data, error } = await supabase.from(ops.table).select('*').eq('trip_id', tripId);
        if (error) { console.error(error); return []; }
        return (data as unknown[]).map(ops.fromRow);
      }
      return lsGetAll<T>(ops.lsKey).filter(i => i.tripId === tripId);
    },

    async create(data: Insert): Promise<T> {
      const userId = await getActiveUserId();
      if (userId) {
        const supabase = getSupabaseBrowser()!;
        const { data: row, error } = await supabase
          .from(ops.table).insert(ops.toRowInsert(data, userId)).select().single();
        if (error) throw error;
        return ops.fromRow(row);
      }
      const item = { ...(data as object), id: uuidv4() } as unknown as T;
      lsSaveAll(ops.lsKey, [...lsGetAll<T>(ops.lsKey), item]);
      return item;
    },

    async update(id: string, data: Partial<T>): Promise<void> {
      const userId = await getActiveUserId();
      if (userId) {
        const supabase = getSupabaseBrowser()!;
        await supabase.from(ops.table).update(ops.toRowUpdate(data)).eq('id', id);
        return;
      }
      const items = lsGetAll<T>(ops.lsKey);
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) { items[idx] = { ...items[idx], ...data }; lsSaveAll(ops.lsKey, items); }
    },

    async delete(id: string): Promise<void> {
      const userId = await getActiveUserId();
      if (userId) {
        const supabase = getSupabaseBrowser()!;
        await supabase.from(ops.table).delete().eq('id', id);
        return;
      }
      lsSaveAll(ops.lsKey, lsGetAll<T>(ops.lsKey).filter(i => i.id !== id));
    },

    async deleteByTrip(tripId: string): Promise<void> {
      const userId = await getActiveUserId();
      if (userId) {
        const supabase = getSupabaseBrowser()!;
        await supabase.from(ops.table).delete().eq('trip_id', tripId);
        return;
      }
      lsSaveAll(ops.lsKey, lsGetAll<T>(ops.lsKey).filter(i => i.tripId !== tripId));
    },
  };
}

// ---------- Flights ----------

export const flightsStorage = makeChildStorage<Flight, Omit<Flight, 'id'>>({
  table: 'flights',
  lsKey: KEYS.flights,
  fromRow: flightFromRow,
  toRowInsert: (d, userId) => ({
    user_id: userId, trip_id: d.tripId, type: d.type,
    airline: d.airline || null,
    departure_airport: d.departureAirport || null,
    arrival_airport: d.arrivalAirport || null,
    departure_date: d.departureDate || null,
    departure_time: d.departureTime || null,
    price: d.price || null,
  }),
  toRowUpdate: (d) => {
    const p: Record<string, unknown> = {};
    if (d.type !== undefined) p.type = d.type;
    if (d.airline !== undefined) p.airline = d.airline || null;
    if (d.departureAirport !== undefined) p.departure_airport = d.departureAirport || null;
    if (d.arrivalAirport !== undefined) p.arrival_airport = d.arrivalAirport || null;
    if (d.departureDate !== undefined) p.departure_date = d.departureDate || null;
    if (d.departureTime !== undefined) p.departure_time = d.departureTime || null;
    if (d.price !== undefined) p.price = d.price || null;
    return p;
  },
});

// ---------- Hotels ----------

export const hotelsStorage = makeChildStorage<Hotel, Omit<Hotel, 'id'>>({
  table: 'hotels',
  lsKey: KEYS.hotels,
  fromRow: hotelFromRow,
  toRowInsert: (d, userId) => ({
    user_id: userId, trip_id: d.tripId,
    city: d.city || null,
    hotel_name: d.hotelName || null,
    arrival_date: d.arrivalDate || null,
    departure_date: d.departureDate || null,
    notes: d.notes || null,
    price: d.price || null,
  }),
  toRowUpdate: (d) => {
    const p: Record<string, unknown> = {};
    if (d.city !== undefined) p.city = d.city || null;
    if (d.hotelName !== undefined) p.hotel_name = d.hotelName || null;
    if (d.arrivalDate !== undefined) p.arrival_date = d.arrivalDate || null;
    if (d.departureDate !== undefined) p.departure_date = d.departureDate || null;
    if (d.notes !== undefined) p.notes = d.notes || null;
    if (d.price !== undefined) p.price = d.price || null;
    return p;
  },
});

// ---------- Restaurants ----------

export const restaurantsStorage = makeChildStorage<Restaurant, Omit<Restaurant, 'id'>>({
  table: 'restaurants',
  lsKey: KEYS.restaurants,
  fromRow: restaurantFromRow,
  toRowInsert: (d, userId) => ({
    user_id: userId, trip_id: d.tripId,
    city: d.city || null, name: d.name,
    date: d.date || null, time: d.time || null,
    location: d.location || null, notes: d.notes || null, image_url: d.imageUrl || null,
  }),
  toRowUpdate: (d) => {
    const p: Record<string, unknown> = {};
    if (d.city !== undefined) p.city = d.city || null;
    if (d.name !== undefined) p.name = d.name;
    if (d.date !== undefined) p.date = d.date || null;
    if (d.time !== undefined) p.time = d.time || null;
    if (d.location !== undefined) p.location = d.location || null;
    if (d.notes !== undefined) p.notes = d.notes || null;
    if (d.imageUrl !== undefined) p.image_url = d.imageUrl || null;
    return p;
  },
});

// ---------- Events ----------

export const eventsStorage = makeChildStorage<Event, Omit<Event, 'id'>>({
  table: 'events',
  lsKey: KEYS.events,
  fromRow: eventFromRow,
  toRowInsert: (d, userId) => ({
    user_id: userId, trip_id: d.tripId,
    city: d.city || null, name: d.name,
    date: d.date || null, time: d.time || null,
    location: d.location || null, notes: d.notes || null, image_url: d.imageUrl || null,
  }),
  toRowUpdate: (d) => {
    const p: Record<string, unknown> = {};
    if (d.city !== undefined) p.city = d.city || null;
    if (d.name !== undefined) p.name = d.name;
    if (d.date !== undefined) p.date = d.date || null;
    if (d.time !== undefined) p.time = d.time || null;
    if (d.location !== undefined) p.location = d.location || null;
    if (d.notes !== undefined) p.notes = d.notes || null;
    if (d.imageUrl !== undefined) p.image_url = d.imageUrl || null;
    return p;
  },
});

// ---------- Packing items ----------

export const packingStorage = makeChildStorage<PackingItem, Omit<PackingItem, 'id'>>({
  table: 'packing_items',
  lsKey: KEYS.packingItems,
  fromRow: packingFromRow,
  toRowInsert: (d, userId) => ({
    user_id: userId, trip_id: d.tripId,
    name: d.name, category: d.category || null, is_done: d.isDone,
  }),
  toRowUpdate: (d) => {
    const p: Record<string, unknown> = {};
    if (d.name !== undefined) p.name = d.name;
    if (d.category !== undefined) p.category = d.category || null;
    if (d.isDone !== undefined) p.is_done = d.isDone;
    return p;
  },
});

// ---------- Photos ----------

export const photosStorage = {
  async getByTrip(tripId: string): Promise<Photo[]> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data, error } = await supabase
        .from('photos').select('*').eq('trip_id', tripId).order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return (data as PhotoRow[]).map(photoFromRow);
    }
    return lsGetAll<Photo>(KEYS.photos).filter(p => p.tripId === tripId);
  },
  async create(data: Omit<Photo, 'id' | 'createdAt'>): Promise<Photo> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data: row, error } = await supabase.from('photos').insert({
        user_id: userId, trip_id: data.tripId,
        image_url: data.imageUrl, caption: data.caption || null,
      }).select().single();
      if (error) throw error;
      return photoFromRow(row as PhotoRow);
    }
    const item: Photo = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    lsSaveAll(KEYS.photos, [...lsGetAll<Photo>(KEYS.photos), item]);
    return item;
  },
  async update(id: string, data: Partial<Photo>): Promise<void> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const p: Record<string, unknown> = {};
      if (data.caption !== undefined) p.caption = data.caption || null;
      if (data.imageUrl !== undefined) p.image_url = data.imageUrl;
      await supabase.from('photos').update(p).eq('id', id);
      return;
    }
    const items = lsGetAll<Photo>(KEYS.photos);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) { items[idx] = { ...items[idx], ...data }; lsSaveAll(KEYS.photos, items); }
  },
  async delete(id: string): Promise<void> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      await supabase.from('photos').delete().eq('id', id);
      return;
    }
    lsSaveAll(KEYS.photos, lsGetAll<Photo>(KEYS.photos).filter(i => i.id !== id));
  },
  async deleteByTrip(tripId: string): Promise<void> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      await supabase.from('photos').delete().eq('trip_id', tripId);
      return;
    }
    lsSaveAll(KEYS.photos, lsGetAll<Photo>(KEYS.photos).filter(i => i.tripId !== tripId));
  },
};

// ---------- Notes (one row per trip) ----------

export const notesStorage = {
  async getByTrip(tripId: string): Promise<TripNote | undefined> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      const { data, error } = await supabase
        .from('trip_notes').select('*').eq('trip_id', tripId).maybeSingle();
      if (error || !data) return undefined;
      return noteFromRow(data as NoteRow);
    }
    return lsGetAll<TripNote>(KEYS.notes).find(n => n.tripId === tripId);
  },
  async save(tripId: string, content: string): Promise<TripNote> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      // Upsert by unique (trip_id) constraint.
      const { data, error } = await supabase
        .from('trip_notes')
        .upsert({ user_id: userId, trip_id: tripId, content }, { onConflict: 'trip_id' })
        .select().single();
      if (error) throw error;
      return noteFromRow(data as NoteRow);
    }
    const notes = lsGetAll<TripNote>(KEYS.notes);
    const idx = notes.findIndex(n => n.tripId === tripId);
    const item: TripNote = { id: idx >= 0 ? notes[idx].id : uuidv4(), tripId, content, updatedAt: new Date().toISOString() };
    if (idx >= 0) notes[idx] = item; else notes.push(item);
    lsSaveAll(KEYS.notes, notes);
    return item;
  },
  async deleteByTrip(tripId: string): Promise<void> {
    const userId = await getActiveUserId();
    if (userId) {
      const supabase = getSupabaseBrowser()!;
      await supabase.from('trip_notes').delete().eq('trip_id', tripId);
      return;
    }
    lsSaveAll(KEYS.notes, lsGetAll<TripNote>(KEYS.notes).filter(n => n.tripId !== tripId));
  },
};

// ---------- Backup / Restore (local-only — used to bootstrap cloud accounts) ----------

export const backupStorage = {
  exportLocal: (): BackupData => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      trips: lsGetAll<Trip>(KEYS.trips),
      flights: lsGetAll<Flight>(KEYS.flights),
      hotels: lsGetAll<Hotel>(KEYS.hotels),
      restaurants: lsGetAll<Restaurant>(KEYS.restaurants),
      events: lsGetAll<Event>(KEYS.events),
      packingItems: lsGetAll<PackingItem>(KEYS.packingItems),
      photos: lsGetAll<Photo>(KEYS.photos),
      notes: lsGetAll<TripNote>(KEYS.notes),
    },
  }),
  restoreLocal: (backup: BackupData): void => {
    if (backup.version !== 1 || !backup.data) throw new Error('קובץ גיבוי לא תקין');
    const d = backup.data;
    lsSaveAll(KEYS.trips, d.trips ?? []);
    lsSaveAll(KEYS.flights, d.flights ?? []);
    lsSaveAll(KEYS.hotels, d.hotels ?? []);
    lsSaveAll(KEYS.restaurants, d.restaurants ?? []);
    lsSaveAll(KEYS.events, d.events ?? []);
    lsSaveAll(KEYS.packingItems, d.packingItems ?? []);
    lsSaveAll(KEYS.photos, d.photos ?? []);
    lsSaveAll(KEYS.notes, d.notes ?? []);
  },
  hasLocalData: (): boolean => {
    if (typeof window === 'undefined') return false;
    return lsGetAll<Trip>(KEYS.trips).length > 0;
  },
  clearLocal: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },

  // One-shot upload of all localStorage data into the signed-in user's cloud account.
  // Trip IDs are remapped because the cloud generates fresh UUIDs, so child rows
  // are inserted with the *new* trip_id.
  async migrateLocalToCloud(): Promise<{ trips: number; total: number } | { error: string }> {
    const userId = await getActiveUserId();
    if (!userId) return { error: 'יש להתחבר כדי לסנכרן לענן' };
    const supabase = getSupabaseBrowser()!;

    const localTrips = lsGetAll<Trip>(KEYS.trips);
    if (localTrips.length === 0) return { trips: 0, total: 0 };

    const idMap = new Map<string, string>();
    let total = 0;

    for (const t of localTrips) {
      const { data: row, error } = await supabase.from('trips').insert({
        user_id: userId,
        name: t.name,
        destination: t.destination || null,
        start_date: t.startDate || null,
        end_date: t.endDate || null,
        cover_image: t.coverImage || null,
      }).select('id').single();
      if (error || !row) continue;
      idMap.set(t.id, row.id as string);
      total++;
    }

    const remapTrip = (oldId: string) => idMap.get(oldId);

    // Flights
    for (const f of lsGetAll<Flight>(KEYS.flights)) {
      const newTrip = remapTrip(f.tripId);
      if (!newTrip) continue;
      await supabase.from('flights').insert({
        user_id: userId, trip_id: newTrip, type: f.type,
        airline: f.airline || null,
        departure_airport: f.departureAirport || null,
        arrival_airport: f.arrivalAirport || null,
        departure_date: f.departureDate || null,
        departure_time: f.departureTime || null,
        price: f.price || null,
      });
      total++;
    }

    for (const h of lsGetAll<Hotel>(KEYS.hotels)) {
      const newTrip = remapTrip(h.tripId);
      if (!newTrip) continue;
      await supabase.from('hotels').insert({
        user_id: userId, trip_id: newTrip,
        city: h.city || null, hotel_name: h.hotelName || null,
        arrival_date: h.arrivalDate || null, departure_date: h.departureDate || null,
        notes: h.notes || null, price: h.price || null,
      });
      total++;
    }

    for (const r of lsGetAll<Restaurant>(KEYS.restaurants)) {
      const newTrip = remapTrip(r.tripId);
      if (!newTrip) continue;
      await supabase.from('restaurants').insert({
        user_id: userId, trip_id: newTrip,
        city: r.city || null, name: r.name,
        date: r.date || null, time: r.time || null,
        location: r.location || null, notes: r.notes || null, image_url: r.imageUrl || null,
      });
      total++;
    }

    for (const e of lsGetAll<Event>(KEYS.events)) {
      const newTrip = remapTrip(e.tripId);
      if (!newTrip) continue;
      await supabase.from('events').insert({
        user_id: userId, trip_id: newTrip,
        city: e.city || null, name: e.name,
        date: e.date || null, time: e.time || null,
        location: e.location || null, notes: e.notes || null, image_url: e.imageUrl || null,
      });
      total++;
    }

    for (const p of lsGetAll<PackingItem>(KEYS.packingItems)) {
      const newTrip = remapTrip(p.tripId);
      if (!newTrip) continue;
      await supabase.from('packing_items').insert({
        user_id: userId, trip_id: newTrip,
        name: p.name, category: p.category || null, is_done: p.isDone,
      });
      total++;
    }

    for (const ph of lsGetAll<Photo>(KEYS.photos)) {
      const newTrip = remapTrip(ph.tripId);
      if (!newTrip) continue;
      await supabase.from('photos').insert({
        user_id: userId, trip_id: newTrip,
        image_url: ph.imageUrl, caption: ph.caption || null,
      });
      total++;
    }

    for (const n of lsGetAll<TripNote>(KEYS.notes)) {
      const newTrip = remapTrip(n.tripId);
      if (!newTrip) continue;
      await supabase.from('trip_notes').insert({
        user_id: userId, trip_id: newTrip, content: n.content,
      });
      total++;
    }

    return { trips: localTrips.length, total };
  },
};
