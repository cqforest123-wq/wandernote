// Turning Core Location visits into a trip's footprints.
//
// Every rule here exists because the raw data misbehaves: a visit is reported
// twice, the same café comes back as two points forty metres apart, and a
// visit in progress has no departure time at all.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/visitsToDays.js', import.meta.url), 'utf8');
const {
  tidyVisits, groupVisitsByDay, mergeVisitsIntoTrip, dayKey, stayMinutes, MIN_STAY_MINUTES,
} = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};
const ok = (name, cond) => { if (!cond) { failed++; console.error(`FAIL ${name}`); } };

// Local-midnight based, so build timestamps from local components.
const at = (y, m, d, hh, mm = 0) => new Date(y, m - 1, d, hh, mm).getTime();
const MIN = 60000;

const kyoto = { lat: 35.0116, lng: 135.7681 };
const nearby = { lat: 35.0119, lng: 135.7684 };   // ~40m away
const osaka = { lat: 34.6937, lng: 135.5023 };

const visit = (coords, arrive, minutes) => ({
  coords,
  arrivalAt: arrive,
  departureAt: minutes === null ? null : arrive + minutes * MIN,
  accuracy: 50,
});

// --- filtering -----------------------------------------------------------
check('passing by is not a visit',
  tidyVisits([visit(kyoto, at(2026, 3, 15, 9), MIN_STAY_MINUTES - 1)]).length, 0);
check('a real stay is kept',
  tidyVisits([visit(kyoto, at(2026, 3, 15, 9), MIN_STAY_MINUTES + 1)]).length, 1);

// A visit in progress has no departure. That is where the user is right now.
check('an ongoing visit is kept',
  tidyVisits([visit(kyoto, at(2026, 3, 15, 9), null)]).length, 1);
check('stayMinutes is null while ongoing',
  stayMinutes(visit(kyoto, at(2026, 3, 15, 9), null)), null);

check('coordinates are required', tidyVisits([{ arrivalAt: 1 }]).length, 0);
check('an arrival time is required', tidyVisits([{ coords: kyoto }]).length, 0);
check('null input', tidyVisits(null), []);

// --- merging the same place ----------------------------------------------
const drift = tidyVisits([
  visit(kyoto, at(2026, 3, 15, 9), 60),
  visit(nearby, at(2026, 3, 15, 10, 30), 45),
]);
check('40m apart on one day is one place', drift.length, 1);
check('and the stay runs to the later departure',
  drift[0].departureAt, at(2026, 3, 15, 10, 30) + 45 * MIN);

const twoCities = tidyVisits([
  visit(kyoto, at(2026, 3, 15, 9), 60),
  visit(osaka, at(2026, 3, 15, 14), 60),
]);
check('different cities stay separate', twoCities.length, 2);

// The same spot on a different day is a different visit, not a merge.
const acrossDays = tidyVisits([
  visit(kyoto, at(2026, 3, 15, 9), 60),
  visit(kyoto, at(2026, 3, 16, 9), 60),
]);
check('same place next day is a second visit', acrossDays.length, 2);

check('output is oldest first', tidyVisits([
  visit(osaka, at(2026, 3, 16, 9), 60),
  visit(kyoto, at(2026, 3, 15, 9), 60),
]).map(v => dayKey(v.arrivalAt)), ['2026.03.15', '2026.03.16']);

// --- grouping ------------------------------------------------------------
const grouped = groupVisitsByDay([
  visit(kyoto, at(2026, 3, 15, 9), 60),
  visit(osaka, at(2026, 3, 15, 14), 60),
  visit(osaka, at(2026, 3, 16, 11), 60),
]);
check('two days', grouped.map(d => d.date), ['2026.03.15', '2026.03.16']);
check('first day holds both stops', grouped[0].visits.length, 2);

// --- merging into a trip -------------------------------------------------
const trip = { id: 1, days: [{ date: '2026.03.15', photos: [] }, { date: '2026.03.17', photos: [] }] };
const visits = [
  visit(kyoto, at(2026, 3, 15, 9), 60),
  visit(osaka, at(2026, 3, 16, 9), 60),   // no such day on the trip
];

const merged = mergeVisitsIntoTrip(trip, visits);
check('only matching days take visits', merged.matchedDays, 1);
check('one visit added', merged.addedVisits, 1);
check('the matched day has it', merged.trip.days[0].visits.length, 1);
ok('the unmatched day is untouched', merged.trip.days[1].visits === undefined);

// A visit is evidence of where the phone was, not that a trip happened.
check('no days are invented', merged.trip.days.length, 2);

// Running it twice must not double up.
const again = mergeVisitsIntoTrip(merged.trip, visits);
check('re-running adds nothing', again.addedVisits, 0);
check('and returns the same object so callers can skip saving',
  again.trip === merged.trip, true);

// Existing photos and fields survive.
check('day keeps its other fields', merged.trip.days[0].photos, []);
check('trip keeps its id', merged.trip.id, 1);

// Degenerate input must not throw.
for (const [name, value] of [['null trip', null], ['no days', {}], ['empty days', { days: [] }]]) {
  const r = mergeVisitsIntoTrip(value, visits);
  ok(`${name} adds nothing`, r.addedVisits === 0);
}
check('no visits at all', mergeVisitsIntoTrip(trip, []).addedVisits, 0);

if (failed) { console.error(`\n${failed} visit test(s) failed`); process.exit(1); }
console.log('visit tests passed');
