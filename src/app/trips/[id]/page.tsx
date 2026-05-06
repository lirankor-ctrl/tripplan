'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trip } from '@/lib/types';
import {
  tripsStorage, flightsStorage, hotelsStorage,
  restaurantsStorage, eventsStorage, packingStorage,
} from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import Link from 'next/link';
import {
  Plane, Hotel, UtensilsCrossed, Music, Package,
  Calendar, Camera, FileText, Printer, MapPin,
  CalendarDays, ChevronLeft,
} from 'lucide-react';

const sections = [
  { href: 'flights', label: 'טיסות', icon: Plane, colorClass: 'bg-blue-50 text-blue-600', description: 'טיסות בינלאומיות ופנימיות' },
  { href: 'hotels', label: 'מלונות', icon: Hotel, colorClass: 'bg-purple-50 text-purple-600', description: 'לינה ואירוח' },
  { href: 'restaurants', label: 'מסעדות', icon: UtensilsCrossed, colorClass: 'bg-green-50 text-green-600', description: 'הזמנות ומסעדות' },
  { href: 'events', label: 'אירועים והופעות', icon: Music, colorClass: 'bg-orange-50 text-orange-600', description: 'כרטיסים ואירועים' },
  { href: 'packing', label: 'רשימת אריזה', icon: Package, colorClass: 'bg-yellow-50 text-yellow-600', description: 'מה לארוז' },
  { href: 'calendar', label: 'לוח שנה', icon: Calendar, colorClass: 'bg-indigo-50 text-indigo-600', description: 'תצוגת כל האירועים' },
  { href: 'photos', label: 'אלבום תמונות', icon: Camera, colorClass: 'bg-pink-50 text-pink-600', description: 'תמונות מהטיול' },
  { href: 'notes', label: 'הערות', icon: FileText, colorClass: 'bg-teal-50 text-teal-600', description: 'הערות חופשיות' },
  { href: 'export', label: 'ייצוא והדפסה', icon: Printer, colorClass: 'bg-gray-50 text-gray-600', description: 'הדפסה ו-PDF' },
];

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80';

export default function TripDashboard() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stats, setStats] = useState({
    flights: 0, hotels: 0, restaurants: 0, events: 0, packing: 0, packingDone: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, flights, hotels, restaurants, events, packingItems] = await Promise.all([
        tripsStorage.getById(id),
        flightsStorage.getByTrip(id),
        hotelsStorage.getByTrip(id),
        restaurantsStorage.getByTrip(id),
        eventsStorage.getByTrip(id),
        packingStorage.getByTrip(id),
      ]);
      if (cancelled) return;
      if (!t) return;
      setTrip(t);
      setStats({
        flights: flights.length,
        hotels: hotels.length,
        restaurants: restaurants.length,
        events: events.length,
        packing: packingItems.length,
        packingDone: packingItems.filter(p => p.isDone).length,
      });
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (!trip) return null;

  return (
    <div dir="rtl">
      {/* Trip cover header */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={trip.coverImage || COVER_DEFAULT}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5 leading-tight">{trip.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
            {trip.destination && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {trip.destination}
              </span>
            )}
            {(trip.startDate || trip.endDate) && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(trip.startDate)}
                {trip.startDate && trip.endDate && ' — '}
                {formatDate(trip.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Stats — 3 cols on mobile, 5 on desktop */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-6">
          {[
            { label: 'טיסות', value: stats.flights, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'מלונות', value: stats.hotels, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'מסעדות', value: stats.restaurants, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'אירועים', value: stats.events, color: 'text-orange-600', bg: 'bg-orange-50' },
            {
              label: 'אריזה',
              value: stats.packing > 0 ? `${stats.packingDone}/${stats.packing}` : '0',
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
            },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
              <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map(({ href, label, icon: Icon, colorClass, description }) => (
            <Link key={href} href={`/trips/${id}/${href}`}>
              <Card hover className="group">
                <CardBody className="flex items-center gap-3 p-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
