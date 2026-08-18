// Offline reverse geocoding: the fallback that names a photo when neither
// Apple nor Nominatim can be reached.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/offlineReverseGeocode.js', import.meta.url), 'utf8');
// Swap the diagnostics import for a no-op rather than stripping the calls:
// their arguments contain parentheses, and a regex that tried to cut them out
// left the file syntactically broken.
const body = src.replace(
  /^import \{ logEvent \} from '\.\/diagnostics';$/m,
  'const logEvent = () => {};'
);

const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(body).toString('base64')
);
const { offlineReverseGeocode, distanceKm, OFFLINE_CITY_COUNT, OFFLINE_MAX_MATCH_KM } = mod;

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};
const ok = (name, cond) => { if (!cond) { failed++; console.error(`FAIL ${name}`); } };

// The case that prompted the whole thing: Waikiki, Oahu.
const waikiki = offlineReverseGeocode(21.2793, -157.8292, 'en');
check('Waikiki names Honolulu', waikiki?.city, 'Honolulu');
check('Waikiki names its country', waikiki?.country, 'United States');
ok('offline results declare themselves approximate', waikiki?.approximate === true);

// Language picks the script, not the match.
const waikikiZh = offlineReverseGeocode(21.2793, -157.8292, 'zh');
check('Chinese gets the Chinese name', waikikiZh?.city, '檀香山');
check('Chinese gets the Chinese country', waikikiZh?.country, '美国');
check('zh-Hans is still Chinese', offlineReverseGeocode(21.2793, -157.8292, 'zh-Hans')?.city, '檀香山');

// Distinct Hawaiian islands must not collapse into one another.
check('Maui stays Maui', offlineReverseGeocode(20.79, -156.33, 'en')?.city, 'Maui');
check('Kauai stays Lihue', offlineReverseGeocode(22.08, -159.32, 'en')?.city, 'Lihue');

// Ordinary mainland cases.
check('Chengdu', offlineReverseGeocode(30.65, 104.08, 'zh')?.city, '成都');
check('central Tokyo', offlineReverseGeocode(35.69, 139.70, 'en')?.city, 'Tokyo');
check('Paris', offlineReverseGeocode(48.85, 2.29, 'en')?.city, 'Paris');

// Silence beats a wrong label: mid-ocean has no nearby city.
check('mid Pacific names nothing', offlineReverseGeocode(0, -140, 'en'), null);
check('deep Southern Ocean names nothing', offlineReverseGeocode(-60, 100, 'en'), null);

// Bad input must not throw or invent a place.
check('NaN latitude', offlineReverseGeocode(NaN, 10, 'en'), null);
check('missing coordinates', offlineReverseGeocode(undefined, undefined, 'en'), null);

// Haversine sanity, so a silent unit error cannot widen the radius.
const parisLondon = distanceKm(48.86, 2.35, 51.51, -0.13);
ok(`Paris-London is ~344km (got ${Math.round(parisLondon)})`, Math.abs(parisLondon - 344) < 15);
ok('identical points are zero apart', distanceKm(30, 100, 30, 100) < 0.001);

ok(`table is populated (${OFFLINE_CITY_COUNT})`, OFFLINE_CITY_COUNT > 300);
ok(`radius stays honest (${OFFLINE_MAX_MATCH_KM}km)`, OFFLINE_MAX_MATCH_KM <= 250);

if (failed) { console.error(`\n${failed} offline geocode test(s) failed`); process.exit(1); }
console.log('offline geocode tests passed');
