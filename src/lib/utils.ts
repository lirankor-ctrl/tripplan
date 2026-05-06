import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}



export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const GLOBE_IMAGES = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
];

// Stable default rendered on the server and during the first client paint —
// keeps SSR and hydration markup identical. The random pick happens after mount.
export const DEFAULT_GLOBE_IMAGE = GLOBE_IMAGES[0];

export function getRandomGlobeImage(): string {
  return GLOBE_IMAGES[Math.floor(Math.random() * GLOBE_IMAGES.length)];
}

export const CATEGORY_COLORS = {
  flight: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  hotel: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  restaurant: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  event: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  note: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
};
