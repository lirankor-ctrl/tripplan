export type FlightType = 'international' | 'internal';

// Sub-type of a transport item. The route + DB column are still called "flight"
// for backwards-compatibility with existing production data; this enum decides
// which icon and label we render. Existing rows default to 'flight' via SQL.
export type TransportType = 'flight' | 'train' | 'bus' | 'car' | 'other';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  tripId: string;
  type: FlightType;
  // Optional: rows from before the migration, or from older clients, won't have it.
  // The UI must always treat undefined as 'flight'.
  transportType?: TransportType;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  departureTime: string;
  price?: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  city: string;
  hotelName: string;
  arrivalDate: string;
  departureDate: string;
  notes?: string;
  price?: string;
}

export interface Restaurant {
  id: string;
  tripId: string;
  city: string;
  name: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
}

export interface Event {
  id: string;
  tripId: string;
  city: string;
  name: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
}

export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  category?: string;
  isDone: boolean;
}

export interface Photo {
  id: string;
  tripId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

export interface TripNote {
  id: string;
  tripId: string;
  content: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'passport'
  | 'insurance'
  | 'flight_ticket'
  | 'hotel_booking'
  | 'car_rental'
  | 'event_ticket'
  | 'visa'
  | 'other';

export interface TripDocument {
  id: string;
  tripId: string;
  name: string;
  category: DocumentCategory;
  // Public/signed URL the browser uses to display or download the file.
  // Empty when the row is metadata-only (storage bucket not configured).
  fileUrl?: string;
  // Storage object path — kept so we can delete the file when the row is deleted.
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'event' | 'note';
  // Only set when type === 'flight' — the calendar uses it to pick the right
  // mode-of-transport icon (plane / train / bus / car / map).
  transportType?: TransportType;
  time?: string;
  details?: string;
  sourceId: string;
}
