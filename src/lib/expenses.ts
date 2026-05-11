// Pure helpers for the Expenses page. Prices live as TEXT in storage so
// users can write "₪400", "$120", "€80", "free", or even leave them empty.
// The parser is intentionally lenient — it strips known currency symbols and
// thousand separators, then tries parseFloat. Failure isn't an error: the
// item still gets shown, just excluded from the numeric total.

const CURRENCY_SYMBOLS: Record<string, string> = {
  '₪': 'ILS', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
};

export interface ParsedPrice {
  raw: string;             // original text the user typed
  amount: number | null;   // parsed number, or null if unparseable
  currency: string | null; // detected currency symbol (₪, $, €...) or null
}

export function parsePrice(raw: string | undefined | null): ParsedPrice {
  const text = (raw ?? '').toString().trim();
  if (!text) return { raw: '', amount: null, currency: null };

  let detected: string | null = null;
  for (const sym of Object.keys(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) { detected = sym; break; }
  }

  // Pull out the number portion: remove anything that isn't a digit, dot, or comma.
  const numericish = text.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  if (!numericish) return { raw: text, amount: null, currency: detected };

  const n = parseFloat(numericish);
  if (!Number.isFinite(n)) return { raw: text, amount: null, currency: detected };
  return { raw: text, amount: n, currency: detected };
}

// Aggregate amounts of the SAME currency. Returns one entry per currency the
// user actually used. Items without a parseable amount are not included.
export function sumByCurrency(parsed: ParsedPrice[]): Array<{ currency: string; total: number }> {
  const buckets = new Map<string, number>();
  for (const p of parsed) {
    if (p.amount == null) continue;
    const key = p.currency ?? '₪'; // bare numbers default to shekel — matches how the app already prefixes ₪.
    buckets.set(key, (buckets.get(key) ?? 0) + p.amount);
  }
  return Array.from(buckets, ([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

export function formatMoney(amount: number, currency: string): string {
  const fixed = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${currency}${fixed}`;
}
