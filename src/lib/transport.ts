// Mapping helpers for transport sub-types. The flights table stores all
// transport items in one list; this module decides which icon and label
// to render per sub-type. Treat undefined as 'flight' so pre-migration
// data from existing production users keeps working.

import { Plane, Train, Bus, Car, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TransportType } from './types';

export const TRANSPORT_TYPES: TransportType[] = ['flight', 'train', 'bus', 'car', 'other'];

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  flight: 'טיסה',
  train: 'רכבת',
  bus: 'אוטובוס',
  car: 'רכב',
  other: 'אחר',
};

export const TRANSPORT_ICONS: Record<TransportType, LucideIcon> = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  other: Map,
};

export function transportTypeOf(t: TransportType | undefined | null): TransportType {
  return t ?? 'flight';
}

export function transportLabel(t: TransportType | undefined | null): string {
  return TRANSPORT_LABELS[transportTypeOf(t)];
}

export function transportIcon(t: TransportType | undefined | null): LucideIcon {
  return TRANSPORT_ICONS[transportTypeOf(t)];
}
