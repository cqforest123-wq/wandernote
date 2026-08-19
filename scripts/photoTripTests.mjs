// The photo-import pipeline: EXIF parsing and day grouping.
//
// These are the functions a whole trip is built from, and they had no tests at
// all. Two real defects came out of this file — coordinates thrown away when
// the name lookup failed, and a GPS check that read a key's presence rather
// than its contents — so the parsing rules are worth pinning down.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/tripFromPhotos.js', import.meta.url), 'utf8');

// Keep only the pure parsing half. The rest reaches for geocoders and
// diagnostics, which a unit test has no business starting.
const cut = src.indexOf('function averageCoords');
// Imports here span several lines, so a line-anchored strip left a dangling
// brace behind.
const body = src
  .slice(0, cut)
  .replace(/^import[\s\S]*?from\s+'[^']+';$/gm, '');

const { parseExifDate, parseExifCoords, groupPhotosByDay } = await import(
  'data:text/javascript;base64,' + Buffer.from(body).toString('base64')
);

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};
const ok = (name, cond) => { if (!cond) { failed++; console.error(`FAIL ${name}`); } };

const t = key => key;

// --- dates ---------------------------------------------------------------
// EXIF separates the date with colons, which Date() reads as invalid.
const d = parseExifDate({ DateTimeOriginal: '2026:03:15 07:30:12' });
ok('EXIF colon date parses', d instanceof Date && !Number.isNaN(d?.getTime()));
check('year',  d?.getFullYear(), 2026);
check('month', d?.getMonth(), 2);
check('day',   d?.getDate(), 15);
check('hour',  d?.getHours(), 7);

check('falls back to DateTimeDigitized',
  parseExifDate({ DateTimeDigitized: '2026:01:02 03:04:05' })?.getFullYear(), 2026);
check('no date fields', parseExifDate({}), null);
check('no exif at all', parseExifDate(undefined), null);
check('unparseable text', parseExifDate({ DateTimeOriginal: 'not a date' }), null);

// --- coordinates ---------------------------------------------------------
check('plain lat/lng', parseExifCoords({ GPS: { Latitude: 21.3, Longitude: 157.8 } }),
  { lat: 21.3, lng: 157.8 });

// Hemisphere lives in a separate Ref field, and getting it wrong puts the
// photo on the opposite side of the planet.
check('south and west are negated',
  parseExifCoords({ GPS: { Latitude: 33.9, LatitudeRef: 'S', Longitude: 18.4, LongitudeRef: 'W' } }),
  { lat: -33.9, lng: -18.4 });
check('west alone', parseExifCoords({ GPS: { Latitude: 21.3, Longitude: 157.8, LongitudeRef: 'W' } }),
  { lat: 21.3, lng: -157.8 });
check('already-negative value is not double-negated',
  parseExifCoords({ GPS: { Latitude: -33.9, LatitudeRef: 'S', Longitude: 18.4 } })?.lat, -33.9);

check('iOS {GPS} dictionary form',
  parseExifCoords({ '{GPS}': { Latitude: 1.5, Longitude: 2.5 } }), { lat: 1.5, lng: 2.5 });
check('GPS-prefixed key names',
  parseExifCoords({ GPSLatitude: 1.5, GPSLongitude: 2.5 }), { lat: 1.5, lng: 2.5 });

// An empty GPS dictionary is what iOS hands over after stripping location.
// It is truthy, which is exactly how a key-presence test let stripped photos
// through as though they were located.
check('empty GPS dictionary yields nothing', parseExifCoords({ GPS: {} }), null);
check('null exif', parseExifCoords(null), null);
check('0,0 is treated as absent, not as the Gulf of Guinea',
  parseExifCoords({ GPS: { Latitude: 0, Longitude: 0 } }), null);

// --- grouping ------------------------------------------------------------
const grouped = groupPhotosByDay([
  { uri: 'a', exif: { DateTimeOriginal: '2026:03:16 09:00:00', GPS: { Latitude: 10, Longitude: 20 } } },
  { uri: 'b', exif: { DateTimeOriginal: '2026:03:15 18:00:00', GPS: { Latitude: 11, Longitude: 21 } } },
  { uri: 'c', exif: { DateTimeOriginal: '2026:03:15 08:00:00' } },
  { uri: 'd', exif: {} },
  { uri: null, exif: { DateTimeOriginal: '2026:03:15 08:00:00' } },
], t);

check('two calendar days', grouped.days.length, 2);
check('days come out in order', grouped.days.map(x => x.date), ['2026.03.15', '2026.03.16']);
check('undated photos are set aside, not dropped', grouped.undated.length, 1);
check('a photo with no uri is skipped entirely', grouped.days[0].photos.length + grouped.days[1].photos.length, 3);

// A photo without GPS still belongs to its day; only coordsList excludes it.
check('day 15 keeps both photos', grouped.days[0].photos.length, 2);
check('day 15 contributes one coordinate', grouped.days[0].coordsList.length, 1);

// takenAt is the earliest of the day, which is what orders the trip.
check('takenAt is the day\'s earliest shot', grouped.days[0].takenAt.getHours(), 8);

check('empty input', groupPhotosByDay([], t), { days: [], undated: [] });
check('null input', groupPhotosByDay(null, t), { days: [], undated: [] });

if (failed) { console.error(`\n${failed} photo trip test(s) failed`); process.exit(1); }
console.log('photo trip tests passed');
