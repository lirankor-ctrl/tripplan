'use client';
import { Trip } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';

interface TripCardProps {
  trip: Trip;
  onDelete: (id: string) => void;
  onEdit: (trip: Trip) => void;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80';

export function TripCard({ trip, onDelete, onEdit }: TripCardProps) {
  return (
    <Card className="overflow-hidden group" hover>
      <div className="relative h-40 overflow-hidden">
        <img
          src={trip.coverImage || DEFAULT_COVER}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
        <div className="absolute bottom-3 right-3 left-3">
          <h3 className="text-white font-bold text-lg leading-tight truncate">{trip.name}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3" dir="rtl">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="truncate">{trip.destination || 'יעד לא צוין'}</span>
        </div>

        {(trip.startDate || trip.endDate) && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              {trip.startDate && formatDate(trip.startDate)}
              {trip.startDate && trip.endDate && ' — '}
              {trip.endDate && formatDate(trip.endDate)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Link href={`/trips/${trip.id}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">פתח טיול</Button>
          </Link>
          <button
            onClick={(e) => { e.preventDefault(); onEdit(trip); }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(trip.id); }}
            className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
