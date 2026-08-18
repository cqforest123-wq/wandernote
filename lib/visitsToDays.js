/**
 * Turning recorded visits into a trip's footprints.
 *
 * Pure, so the grouping and de-duplication rules can be tested without a
 * device — and they need testing, because a visit arrives twice (once on
 * arrival, once on departure) and Core Location reports the same café as two
 * points forty metres apart across a morning.
 */

const EARTH_RADIUS_KM = 6371;

/** Visits closer together than this are the same place. */
const SAME_PLACE_KM = 0.12;

/** Below this, it is passing by rather than visiting. */
export const MIN_STAY_MINUTES = 10;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const pad = n => String(n).padStart(2, '0');

/** The `YYYY.MM.DD` form day records use, in the device's own timezone. */
export function dayKey(ms) {
  const d = new Date(ms);

  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function stayMinutes(visit) {
  if (!visit?.arrivalAt || !visit?.departureAt) return null;

  return Math.max(0, (visit.departureAt - visit.arrivalAt) / 60000);
}

/**
 * Visits worth keeping, oldest first, with repeats of one place folded together.
 *
 * A visit still in progress has no departure and is kept: the user is there
 * now, which is the most interesting place of all.
 */
export function tidyVisits(visits) {
  const usable = (visits || [])
    .filter(v => Number.isFinite(v?.coords?.lat) && Number.isFinite(v?.coords?.lng))
    .filter(v => Number.isFinite(v?.arrivalAt))
    .filter(v => {
      const minutes = stayMinutes(v);
      return minutes === null || minutes >= MIN_STAY_MINUTES;
    })
    .sort((a, b) => a.arrivalAt - b.arrivalAt);

  const merged = [];

  for (const visit of usable) {
    const last = merged[merged.length - 1];

    // Same place, same day, back to back — one stay, not two.
    if (
      last &&
      dayKey(last.arrivalAt) === dayKey(visit.arrivalAt) &&
      distanceKm(last.coords, visit.coords) <= SAME_PLACE_KM
    ) {
      last.departureAt = visit.departureAt ?? last.departureAt;
      continue;
    }

    merged.push({ ...visit, coords: { ...visit.coords } });
  }

  return merged;
}

export function groupVisitsByDay(visits) {
  const byDay = new Map();

  for (const visit of tidyVisits(visits)) {
    const key = dayKey(visit.arrivalAt);

    if (!byDay.has(key)) byDay.set(key, { date: key, visits: [] });
    byDay.get(key).visits.push(visit);
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Attach visits to the trip's existing days.
 *
 * Deliberately does not create days. A visit is evidence of where the phone
 * was, not of a trip having happened — inventing days from it would fill
 * someone's journal with their commute. Returns the unchanged trip when
 * nothing matched, so callers can tell whether to save.
 */
export function mergeVisitsIntoTrip(trip, visits) {
  const byDay = new Map(groupVisitsByDay(visits).map(day => [day.date, day.visits]));

  if (byDay.size === 0) {
    return { trip, matchedDays: 0, addedVisits: 0 };
  }

  let matchedDays = 0;
  let addedVisits = 0;

  const days = (trip?.days || []).map(day => {
    const incoming = byDay.get(day?.date);

    if (!incoming?.length) return day;

    // Re-running this must not pile up duplicates, so an arrival time already
    // present is left alone rather than appended again.
    const known = new Set((day.visits || []).map(v => v?.arrivalAt));
    const fresh = incoming.filter(v => !known.has(v.arrivalAt));

    if (fresh.length === 0) return day;

    matchedDays++;
    addedVisits += fresh.length;

    return {
      ...day,
      visits: [...(day.visits || []), ...fresh].sort((a, b) => a.arrivalAt - b.arrivalAt),
    };
  });

  if (addedVisits === 0) {
    return { trip, matchedDays: 0, addedVisits: 0 };
  }

  return { trip: { ...trip, days }, matchedDays, addedVisits };
}
