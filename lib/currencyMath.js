// Pure money maths, deliberately free of React Native imports so it can be
// unit-tested directly under node. `lib/currency.js` re-exports all of this
// alongside the storage- and network-backed helpers.

/** Currencies conventionally written without decimals. */
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR']);

// Kept deliberately short: a picker with 160 entries is unusable on a phone,
// and these cover the overwhelming majority of trips. A currency arriving from
// a backup still converts correctly as long as the rate table knows it.
export const COMMON_CURRENCIES = [
  { code: 'CNY', symbol: '¥' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
  { code: 'KRW', symbol: '₩' },
  { code: 'GBP', symbol: '£' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'THB', symbol: '฿' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'MYR', symbol: 'RM' },
  { code: 'VND', symbol: '₫' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'NZD', symbol: 'NZ$' },
  { code: 'IDR', symbol: 'Rp' },
  { code: 'PHP', symbol: '₱' },
  { code: 'INR', symbol: '₹' },
  { code: 'AED', symbol: 'AED' },
  { code: 'TRY', symbol: '₺' },
  { code: 'RUB', symbol: '₽' },
];

export function currencySymbol(code) {
  const match = COMMON_CURRENCIES.find(item => item.code === code);

  return match ? match.symbol : code;
}

export function formatMoney(amount, code) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return '';
  }

  const digits = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
  const fixed = value.toFixed(digits);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${currencySymbol(code)}${grouped}${fraction ? '.' + fraction : ''}`;
}

/**
 * Convert between currencies using a base-anchored rate table.
 * Returns null when either side is missing, so callers fall back to showing
 * the original amount rather than a wrong one.
 */
export function convert(amount, from, to, rateTable) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (from === to) {
    return value;
  }

  const rates = rateTable?.rates;

  if (!rates) {
    return null;
  }

  const fromRate = from === rateTable.base ? 1 : Number(rates[from]);
  const toRate = to === rateTable.base ? 1 : Number(rates[to]);

  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate === 0) {
    return null;
  }

  return (value / fromRate) * toRate;
}

/**
 * Sum expenses into one currency.
 *
 * `unconvertible` lists entries no rate could cover, so the UI can admit the
 * total is partial instead of quietly under-reporting it.
 */
export function sumExpenses(expenses, homeCurrency, rateTable) {
  let total = 0;
  const unconvertible = [];

  for (const expense of expenses || []) {
    const amount = Number(expense?.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    const code = expense?.currency || homeCurrency;
    const value = convert(amount, code, homeCurrency, rateTable);

    if (value === null) {
      unconvertible.push(expense);
      continue;
    }

    total += value;
  }

  return { total, unconvertible };
}

export function sumByCategory(expenses, homeCurrency, rateTable) {
  const totals = {};

  for (const expense of expenses || []) {
    const amount = Number(expense?.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    const code = expense?.currency || homeCurrency;
    const value = convert(amount, code, homeCurrency, rateTable);

    if (value === null) {
      continue;
    }

    const category = expense?.category || 'other';
    totals[category] = (totals[category] || 0) + value;
  }

  return totals;
}

export function collectTripExpenses(trip) {
  const out = [];

  for (const day of trip?.days || []) {
    for (const expense of day?.expenses || []) {
      out.push(expense);
    }
  }

  return out;
}
