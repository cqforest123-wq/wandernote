// The numbers printed on a shareable trip card.
//
// Other people see this card, so a wrong figure on it is a different kind of
// mistake from a wrong figure inside the app.
import { readFileSync } from 'node:fs';

async function load(path) {
  const src = readFileSync(new URL(path, import.meta.url), 'utf8');
  return src;
}

// currencyMath has no React Native imports, so it loads as-is.
const mathSrc = await load('../lib/currencyMath.js');
// Replace via a function, not a string: currencyMath contains a `$` symbol
// literal, and `$'` in a replacement string means "everything after the match".
const statsSrc = (await load('../lib/tripShareStats.js')).replace(
  /^import .*from '\.\/currencyMath';$/m,
  () => mathSrc
);

const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(statsSrc).toString('base64')
);
const { buildTripShareStats, travelledKm, pickCoverPhotos, tripDateRange, countPhotos } = mod;

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};
const ok = (name, cond) => { if (!cond) { failed++; console.error(`FAIL ${name}`); } };

// convert() takes { base, rates }, not a flat map.
const rates = { base: 'USD', rates: { JPY: 150, CNY: 7 } };

const trip = {
  city: 'Kyoto', country: 'Japan',
  days: [
    { date: '2026.03.15', photos: [{ uri: 'a', coords: { lat: 35.0, lng: 135.7 }, takenAt: '001' }, { uri: 'b' }],
      memos: [{ text: 'x' }],
      expenses: [{ amount: 3000, currency: 'JPY' }] },
    { date: '2026.03.16', photos: [{ uri: 'c', coords: { lat: 35.5, lng: 135.7 }, takenAt: '002' }],
      expenses: [{ amount: 10, currency: 'USD' }] },
  ],
};

const stats = buildTripShareStats(trip, { homeCurrency: 'USD', rates, usesMetric: true });
check('title joins city and country', stats.title, 'Kyoto, Japan');
check('date range spans first to last', stats.dateRange, '2026.03.15 – 2026.03.16');
check('days', stats.days, 2);
check('photos counts every day', stats.photos, 3);
check('memos', stats.memos, 1);
ok('spend is formatted', typeof stats.spend === 'string' && stats.spend.length > 0);
ok(`distance in km (${stats.distance})`, /^\d+ km$/.test(stats.distance));

// Half a degree of latitude is ~55km, which the imperial branch must convert.
const imperial = buildTripShareStats(trip, { homeCurrency: 'USD', rates, usesMetric: false });
ok(`distance in miles (${imperial.distance})`, /^\d+ mi$/.test(imperial.distance));

// A total that silently drops entries is worse than no total.
const unconvertible = buildTripShareStats(
  { ...trip, days: [{ date: 'd', expenses: [{ amount: 5, currency: 'XYZ' }] }] },
  { homeCurrency: 'USD', rates }
);
check('an unconvertible currency suppresses the total', unconvertible.spend, null);

const noCurrency = buildTripShareStats(trip, { homeCurrency: null, rates });
check('no home currency, no total', noCurrency.spend, null);

// GPS jitter must not accumulate into a journey.
// takenAt is compared as a string, so pad it — real values are timestamps,
// where lexicographic order is chronological order. Bare integers sort
// 0, 1, 10, 11, … 2, which shuffles the points and manufactures distance.
const jitter = {
  days: [{ photos: Array.from({ length: 50 }, (_, i) => ({
    uri: String(i), takenAt: String(i).padStart(3, '0'),
    coords: { lat: 35 + i * 0.0002, lng: 135 },
  })) }],
};
ok(`standing still travels nothing (got ${travelledKm(jitter).toFixed(2)}km)`, travelledKm(jitter) === 0);
check('and no distance is printed',
  buildTripShareStats(jitter, { homeCurrency: 'USD', rates }).distance, null);

// Covers should represent the trip, not just its busiest day.
const lopsided = {
  days: [
    { photos: [{ uri: 'd1a' }, { uri: 'd1b' }, { uri: 'd1c' }, { uri: 'd1d' }, { uri: 'd1e' }] },
    { photos: [{ uri: 'd2a' }] },
    { photos: [{ uri: 'd3a' }] },
  ],
};
check('covers take one per day before seconds',
  pickCoverPhotos(lopsided, 4), ['d1a', 'd2a', 'd3a', 'd1b']);
check('covers stop at the limit', pickCoverPhotos(lopsided, 2).length, 2);
check('no photos, no covers', pickCoverPhotos({ days: [] }), []);

// Degenerate input must not throw.
for (const [name, value] of [['null', null], ['empty', {}], ['no days', { city: 'X' }]]) {
  const s = buildTripShareStats(value, { homeCurrency: 'USD', rates });
  ok(`${name} trip yields zero days`, s.days === 0);
  ok(`${name} trip yields no distance`, s.distance === null);
}
check('a single-day trip shows one date', tripDateRange({ days: [{ date: '2026.01.01' }] }), '2026.01.01');
check('no days falls back to the planned date',
  tripDateRange({ days: [], plannedDate: '2026.05.01' }), '2026.05.01');
check('countPhotos on null', countPhotos(null), 0);

if (failed) { console.error(`\n${failed} trip share test(s) failed`); process.exit(1); }
console.log('trip share tests passed');
