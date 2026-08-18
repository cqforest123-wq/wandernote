import {
  ComposeOutdoorGlanceSnapshotInput,
  OutdoorGlanceWeatherDraft,
} from './OutdoorGlanceSnapshot';

type TripLike = {
  id?: string | number | null;
  city?: string | null;
  country?: string | null;
  date?: string | null;
  plannedDate?: string | null;
  coords?: {
    lat?: number | string | null;
    lng?: number | string | null;
  } | null;
  days?: Array<{
    date?: string | null;
  }> | null;
};

export type OutdoorGlanceAppStateInput = {
  trips?: TripLike[] | null;
  weather?: OutdoorGlanceWeatherDraft | null;
  language?: string | null;
  /** Formatted by the caller, which owns the home currency and rate table. */
  todaySpendText?: string | null;
  now?: Date;
};

export function makeOutdoorGlanceSnapshotInputFromAppState({
  trips,
  weather,
  language,
  todaySpendText,
  now = new Date(),
}: OutdoorGlanceAppStateInput): ComposeOutdoorGlanceSnapshotInput {
  const trip = selectOutdoorGlanceTrip(trips, now);

  if (!trip) {
    return {
      trip: null,
      location: null,
      altitude: null,
      weather: null,
      sun: null,
      activity: null,
      parking: null,
      language: language ?? null,
      todaySpendText: null,
    };
  }

  return {
    trip: {
      id: trip.id ?? '',
      name: makeTripName(trip),
      dayNumber: getTripDayNumber(trip, now),
    },
    location: makeDestinationLocation(trip),
    altitude: null,
    weather: weather ?? null,
    sun: null,
    activity: null,
    parking: null,
    language: language ?? null,
    todaySpendText: todaySpendText ?? null,
  };
}

export function selectOutdoorGlanceTrip(
  trips?: TripLike[] | null,
  now: Date = new Date()
): TripLike | null {
  if (!Array.isArray(trips) || trips.length === 0) {
    return null;
  }

  const upcoming = trips
    .map(trip => ({
      trip,
      plannedAt: parseTripDate(trip?.plannedDate),
    }))
    .filter(item => item.plannedAt && startOfDay(item.plannedAt) >= startOfDay(now))
    .sort((a, b) => {
      const aTime = a.plannedAt?.getTime() ?? 0;
      const bTime = b.plannedAt?.getTime() ?? 0;
      return aTime - bTime;
    })[0]?.trip;

  if (upcoming) {
    return upcoming;
  }

  return [...trips].sort((a, b) => {
    const aDate = String(a?.date || '');
    const bDate = String(b?.date || '');
    return bDate.localeCompare(aDate);
  })[0] ?? null;
}

function makeTripName(trip: TripLike): string {
  return [trip.city, trip.country]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
}

function makeDestinationLocation(trip: TripLike) {
  const latitude = Number(trip.coords?.lat);
  const longitude = Number(trip.coords?.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    name: makeTripName(trip),
    latitude,
    longitude,
    horizontalAccuracyMeters: null,
  };
}

function getTripDayNumber(trip: TripLike, now: Date): number | null {
  const todayText = formatTripDate(now);
  const matchingDayIndex = Array.isArray(trip.days)
    ? trip.days.findIndex(day => day?.date === todayText)
    : -1;

  if (matchingDayIndex >= 0) {
    return matchingDayIndex + 1;
  }

  const plannedAt = parseTripDate(trip.plannedDate);
  if (!plannedAt) {
    return null;
  }

  const start = startOfDay(plannedAt);
  const current = startOfDay(now);
  if (current < start) {
    return null;
  }

  return Math.floor((current.getTime() - start.getTime()) / 86400000) + 1;
}

function parseTripDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parts = value.split('.').map(part => Number(part));
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  return Number.isFinite(date.getTime()) ? date : null;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatTripDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('.');
}
