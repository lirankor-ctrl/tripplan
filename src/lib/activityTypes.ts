// Mapping helpers for activity categories. Mirrors transport.ts's shape:
// one place decides label/emoji/icon per type, and 'concert' is the fallback
// for undefined/null so legacy activities (created before this feature)
// keep rendering exactly as they did — "הופעה" with the music icon.

import {
  Music, Drama, Landmark, FerrisWheel, Trees, Waves, Mountain, Footprints,
  ShoppingBag, Wine, ChefHat, Palette, Trophy, PartyPopper, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType } from './types';

export const ACTIVITY_TYPES: ActivityType[] = [
  'concert', 'play', 'museum', 'amusement_park', 'nature_park', 'beach',
  'trip', 'guided_tour', 'shopping', 'winery', 'culinary', 'exhibition',
  'sports_event', 'festival', 'other',
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  concert: 'הופעה',
  play: 'הצגה',
  museum: 'מוזיאון',
  amusement_park: 'פארק שעשועים',
  nature_park: 'פארק / טבע',
  beach: 'חוף ים',
  trip: 'טיול',
  guided_tour: 'סיור מודרך',
  shopping: 'קניות',
  winery: 'יקב',
  culinary: 'חוויה קולינרית',
  exhibition: 'תערוכה',
  sports_event: 'אירוע ספורט',
  festival: 'פסטיבל',
  other: 'אחר',
};

// For <select><option> text only — native options can't render a LucideIcon.
export const ACTIVITY_TYPE_EMOJI: Record<ActivityType, string> = {
  concert: '🎵',
  play: '🎭',
  museum: '🏛️',
  amusement_park: '🎢',
  nature_park: '🌿',
  beach: '🏖️',
  trip: '🏞️',
  guided_tour: '🚶',
  shopping: '🛍️',
  winery: '🍷',
  culinary: '🍽️',
  exhibition: '🎨',
  sports_event: '🏟️',
  festival: '🎪',
  other: '📍',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  concert: Music,
  play: Drama,
  museum: Landmark,
  amusement_park: FerrisWheel,
  nature_park: Trees,
  beach: Waves,
  trip: Mountain,
  guided_tour: Footprints,
  shopping: ShoppingBag,
  winery: Wine,
  culinary: ChefHat,
  exhibition: Palette,
  sports_event: Trophy,
  festival: PartyPopper,
  other: MapPin,
};

export function activityTypeOf(t: ActivityType | undefined | null): ActivityType {
  return t ?? 'concert';
}

export function activityTypeLabel(t: ActivityType | undefined | null): string {
  return ACTIVITY_TYPE_LABELS[activityTypeOf(t)];
}

export function activityTypeIcon(t: ActivityType | undefined | null): LucideIcon {
  return ACTIVITY_TYPE_ICONS[activityTypeOf(t)];
}
