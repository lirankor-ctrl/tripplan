'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Flight, Hotel } from '@/lib/types';
import { flightsStorage, hotelsStorage } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { transportIcon, transportLabel, transportTypeOf } from '@/lib/transport';
import { parsePrice, sumByCurrency, formatMoney, type ParsedPrice } from '@/lib/expenses';
import {
  Hotel as HotelIcon, UtensilsCrossed, Music, Receipt, MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// One row of the expenses list. Built from any item that already exposes
// a `price` field — currently transport (flights table) and hotels.
// Restaurants and events don't have a price column today, so they appear in
// the category list as empty buckets (matches the spec: "If some pages do
// not currently have price fields, do not break anything").
interface ExpenseEntry {
  id: string;
  category: 'transport' | 'hotels' | 'restaurants' | 'events' | 'other';
  itemType: string;        // human label, e.g. "טיסה", "מלון"
  name: string;
  date?: string;
  parsed: ParsedPrice;
  notes?: string;
  icon: LucideIcon;
}

const CATEGORY_LABELS: Record<ExpenseEntry['category'], string> = {
  transport: 'טיסות / העברות',
  hotels: 'מלונות',
  restaurants: 'מסעדות',
  events: 'אירועים',
  other: 'אחר',
};

const CATEGORY_ORDER: ExpenseEntry['category'][] = ['transport', 'hotels', 'restaurants', 'events', 'other'];

const CATEGORY_ICONS: Record<ExpenseEntry['category'], LucideIcon> = {
  transport: Receipt,
  hotels: HotelIcon,
  restaurants: UtensilsCrossed,
  events: Music,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ExpenseEntry['category'], { chip: string; total: string }> = {
  transport: { chip: 'bg-blue-50 text-blue-600', total: 'text-blue-700' },
  hotels: { chip: 'bg-purple-50 text-purple-600', total: 'text-purple-700' },
  restaurants: { chip: 'bg-green-50 text-green-600', total: 'text-green-700' },
  events: { chip: 'bg-orange-50 text-orange-600', total: 'text-orange-700' },
  other: { chip: 'bg-gray-50 text-gray-600', total: 'text-gray-700' },
};

function buildEntries(
  flights: Flight[],
  hotels: Hotel[],
): ExpenseEntry[] {
  const entries: ExpenseEntry[] = [];

  for (const f of flights) {
    if (!f.price) continue;
    const tt = transportTypeOf(f.transportType);
    const route = [f.departureAirport, f.arrivalAirport].filter(Boolean).join(' → ');
    const name = route || f.airline || transportLabel(tt);
    entries.push({
      id: `flight_${f.id}`,
      category: 'transport',
      itemType: transportLabel(tt),
      name,
      date: f.departureDate || undefined,
      parsed: parsePrice(f.price),
      icon: transportIcon(tt),
    });
  }

  for (const h of hotels) {
    if (!h.price) continue;
    entries.push({
      id: `hotel_${h.id}`,
      category: 'hotels',
      itemType: 'מלון',
      name: h.hotelName || h.city || 'מלון',
      date: h.arrivalDate || undefined,
      parsed: parsePrice(h.price),
      notes: h.notes,
      icon: HotelIcon,
    });
  }

  return entries;
}

export default function ExpensesPage() {
  const { id } = useParams<{ id: string }>();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // Only flights and hotels currently expose a price field. The
        // restaurants/events buckets stay empty until those tables grow one;
        // adding the fetch then is a one-line change.
        const [f, h] = await Promise.all([
          flightsStorage.getByTrip(id),
          hotelsStorage.getByTrip(id),
        ]);
        if (cancelled) return;
        setFlights(f); setHotels(h);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const entries = useMemo(() => buildEntries(flights, hotels), [flights, hotels]);

  const grouped = useMemo(() => {
    const map: Record<ExpenseEntry['category'], ExpenseEntry[]> = {
      transport: [], hotels: [], restaurants: [], events: [], other: [],
    };
    for (const e of entries) map[e.category].push(e);
    // Sort each bucket: dated by date asc, undated last.
    for (const k of CATEGORY_ORDER) {
      map[k].sort((a, b) => {
        if (!a.date && !b.date) return a.name.localeCompare(b.name);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });
    }
    return map;
  }, [entries]);

  const grandTotals = useMemo(() => sumByCurrency(entries.map(e => e.parsed)), [entries]);
  const categoryTotals = useMemo(() => {
    const out: Record<ExpenseEntry['category'], Array<{ currency: string; total: number }>> = {
      transport: [], hotels: [], restaurants: [], events: [], other: [],
    };
    for (const k of CATEGORY_ORDER) {
      out[k] = sumByCurrency(grouped[k].map(e => e.parsed));
    }
    return out;
  }, [grouped]);

  // Items where price text exists but couldn't be summed — surface so users
  // can see the page didn't drop their data, just couldn't math it.
  const unparseable = useMemo(
    () => entries.filter(e => e.parsed.raw && e.parsed.amount == null),
    [entries],
  );

  if (loading) return <LoadingState />;

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">הוצאות</h1>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="עדיין אין הוצאות"
          description="הוסף מחירים בנסיעות ובמלונות והם יופיעו כאן באופן אוטומטי"
        />
      ) : (
        <>
          {/* Grand-total banner */}
          <Card className="mb-6">
            <CardBody className="p-5">
              <p className="text-sm text-gray-500 mb-2">סך כל ההוצאות</p>
              {grandTotals.length === 0 ? (
                <p className="text-gray-400 text-sm">לא ניתן לסכם — אין מחירים מספריים</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {grandTotals.map(t => (
                    <div key={t.currency} className="rounded-xl bg-indigo-50 px-4 py-2">
                      <span className="text-2xl font-bold text-indigo-700">{formatMoney(t.total, t.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
              {unparseable.length > 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  {unparseable.length} פריט(ים) עם מחיר שלא ניתן לסכימה — מופיעים בטבלה אך לא בסך הכל.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Per-category breakdown */}
          <div className="space-y-5">
            {CATEGORY_ORDER.map(cat => {
              const items = grouped[cat];
              const totals = categoryTotals[cat];
              const colors = CATEGORY_COLORS[cat];
              const Icon = CATEGORY_ICONS[cat];
              return (
                <Card key={cat}>
                  <CardBody className="p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.chip}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h2 className="font-semibold text-gray-900">{CATEGORY_LABELS[cat]}</h2>
                      </div>
                      <div className={`text-right font-semibold ${colors.total}`}>
                        {totals.length === 0 ? (
                          <span className="text-gray-400 text-sm">—</span>
                        ) : (
                          totals.map(t => (
                            <div key={t.currency} className="text-sm">{formatMoney(t.total, t.currency)}</div>
                          ))
                        )}
                      </div>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">אין הוצאות בקטגוריה זו</p>
                    ) : (
                      // Mobile: stacked cards. Desktop: simple table-like rows.
                      <div className="space-y-2">
                        {items.map(item => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm"
                            >
                              <ItemIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <span className="font-medium text-gray-900 truncate">{item.name}</span>
                                  <span className="text-xs text-gray-400">{item.itemType}</span>
                                </div>
                                {item.date && <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.date)}</p>}
                              </div>
                              <div className="text-right font-semibold text-gray-700 flex-shrink-0">
                                {item.parsed.amount == null
                                  ? <span className="text-amber-600 text-xs">{item.parsed.raw}</span>
                                  : formatMoney(item.parsed.amount, item.parsed.currency ?? '₪')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
