import { collectTripExpenses, formatMoney, sumExpenses } from './currencyMath';

/**
 * The numbers on a shareable trip card.
 *
 * Pure and separate from the card itself so the arithmetic can be tested: a
 * card is a thing other people see, and a wrong total on it is embarrassing in
 * a way a wrong total inside the app is not.
 */

const EARTH_RADIUS_KM = 6371;

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

function normalizeCoords(coords) {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
}

/** Photos that carry coordinates, in the order they were taken. */
function locatedPhotos(trip) {
  const points = [];

  for (const day of trip?.days || []) {
    const ofDay = [];

    for (const photo of day?.photos || []) {
      const coords = normalizeCoords(photo?.coords);
      if (coords) ofDay.push({ coords, takenAt: photo?.takenAt });
    }

    ofDay.sort((a, b) => String(a.takenAt || '').localeCompare(String(b.takenAt || '')));
    points.push(...ofDay);
  }

  return points;
}

/**
 * Roughly how far the photos moved, in kilometres.
 *
 * Consecutive shots taken in the same spot add nothing, so anything under a
 * hundred metres is ignored — otherwise GPS jitter alone would accumulate a
 * few kilometres over a day of standing still.
 */
export function travelledKm(trip) {
  const points = locatedPhotos(trip);
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const step = distanceKm(points[i - 1].coords, points[i].coords);
    if (step >= 0.1) total += step;
  }

  return total;
}

export function countPhotos(trip) {
  return (trip?.days || []).reduce((n, day) => n + (day?.photos?.length || 0), 0);
}

export function countMemos(trip) {
  return (trip?.days || []).reduce((n, day) => n + (day?.memos?.length || 0), 0);
}

/** Up to `limit` photos spread across the trip rather than all from day one. */
export function pickCoverPhotos(trip, limit = 4) {
  const byDay = (trip?.days || []).map(day =>
    (day?.photos || []).map(photo => photo?.uri).filter(Boolean)
  );

  const picked = [];
  let round = 0;

  // Take one from each day before taking a second from any, so a trip whose
  // first day happens to hold forty photos still shows the rest of itself.
  while (picked.length < limit && byDay.some(day => day.length > round)) {
    for (const day of byDay) {
      if (picked.length >= limit) break;
      if (day[round]) picked.push(day[round]);
    }
    round++;
  }

  return picked;
}

export function tripDateRange(trip) {
  const dates = (trip?.days || [])
    .map(day => String(day?.date || '').trim())
    .filter(Boolean)
    .sort();

  if (dates.length === 0) {
    return String(trip?.plannedDate || trip?.date || '').trim();
  }

  const first = dates[0];
  const last = dates[dates.length - 1];

  return first === last ? first : `${first} – ${last}`;
}

/**
 * @param usesMetric decided by the caller, which owns the region preference.
 */
export function buildTripShareStats(trip, { homeCurrency, rates, usesMetric = true } = {}) {
  const km = travelledKm(trip);
  const { total, unconvertible } = sumExpenses(
    collectTripExpenses(trip),
    homeCurrency,
    rates
  );

  return {
    title: [trip?.city, trip?.country].map(v => String(v || '').trim()).filter(Boolean).join(', '),
    dateRange: tripDateRange(trip),
    days: (trip?.days || []).length,
    photos: countPhotos(trip),
    memos: countMemos(trip),
    coverPhotos: pickCoverPhotos(trip),
    distance: km >= 1
      ? (usesMetric
          ? `${Math.round(km)} km`
          : `${Math.round(km * 0.621371)} mi`)
      : null,
    // A total that silently omits entries is worse than no total, so an
    // unconvertible currency suppresses the figure rather than understating it.
    spend: homeCurrency && total > 0 && unconvertible.length === 0
      ? formatMoney(total, homeCurrency)
      : null,
  };
}
