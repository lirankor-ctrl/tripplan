export type FlightType = 'international' | 'internal';

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

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'event' | 'note';
  time?: string;
  details?: string;
  sourceId: string;
}
