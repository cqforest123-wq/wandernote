import {
  ComposeOutdoorGlanceSnapshotInput,
  DateLike,
  OUTDOOR_GLANCE_DEFAULT_TTL_MS,
  OUTDOOR_GLANCE_SNAPSHOT_SCHEMA_VERSION,
  OutdoorGlanceActivity,
  OutdoorGlanceActivityDraft,
  OutdoorGlanceAltitude,
  OutdoorGlanceAltitudeDraft,
  OutdoorGlanceLocation,
  OutdoorGlanceLocationDraft,
  OutdoorGlanceParking,
  OutdoorGlanceParkingDraft,
  OutdoorGlanceSnapshot,
  OutdoorGlanceSun,
  OutdoorGlanceSunDraft,
  OutdoorGlanceTrip,
  OutdoorGlanceTripDraft,
  OutdoorGlanceWeather,
  OutdoorGlanceWeatherDraft,
} from './OutdoorGlanceSnapshot';

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export function composeOutdoorGlanceSnapshot(
  input: ComposeOutdoorGlanceSnapshotInput = {}
): OutdoorGlanceSnapshot {
  const generatedAt = toDate(input.now) ?? new Date();
  const ttlMs = normalizePositiveInteger(input.ttlMs) ?? OUTDOOR_GLANCE_DEFAULT_TTL_MS;
  const validUntil = new Date(generatedAt.getTime() + ttlMs);

  return {
    schemaVersion: OUTDOOR_GLANCE_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: createUuid(),
    generatedAt: toIsoString(generatedAt),
    freshness: {
      validUntil: toIsoString(validUntil),
    },
    trip: normalizeTrip(input.trip),
    location: normalizeLocation(input.location, generatedAt),
    altitude: normalizeAltitude(input.altitude, generatedAt),
    weather: normalizeWeather(input.weather, generatedAt),
    sun: normalizeSun(input.sun),
    activity: normalizeActivity(input.activity, generatedAt),
    parking: normalizeParking(input.parking),
    language: normalizeOptionalText(input.language),
    todaySpendText: normalizeOptionalText(input.todaySpendText),
  };
}

/** Trimmed non-empty string, or null. */
function normalizeOptionalText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function fingerprintOutdoorGlanceInput(
  input: ComposeOutdoorGlanceSnapshotInput = {}
): string {
  const stableDate = new Date(0);

  return stableStringify({
    trip: normalizeTrip(input.trip),
    location: normalizeLocation(input.location, stableDate),
    altitude: normalizeAltitude(input.altitude, stableDate),
    weather: normalizeWeather(input.weather, stableDate),
    sun: normalizeSun(input.sun),
    activity: normalizeActivity(input.activity, stableDate),
    parking: normalizeParking(input.parking),
    language: normalizeOptionalText(input.language),
    todaySpendText: normalizeOptionalText(input.todaySpendText),
  });
}

export function calculateDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number | null {
  const fromLat = normalizeLatitude(from.latitude);
  const fromLng = normalizeLongitude(from.longitude);
  const toLat = normalizeLatitude(to.latitude);
  const toLng = normalizeLongitude(to.longitude);

  if (
    fromLat === null ||
    fromLng === null ||
    toLat === null ||
    toLng === null
  ) {
    return null;
  }

  const earthRadiusMeters = 6371000;
  const dLat = degreesToRadians(toLat - fromLat);
  const dLng = degreesToRadians(toLng - fromLng);
  const lat1 = degreesToRadians(fromLat);
  const lat2 = degreesToRadians(toLat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

export function calculateBearingDegrees(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number | null {
  const fromLat = normalizeLatitude(from.latitude);
  const fromLng = normalizeLongitude(from.longitude);
  const toLat = normalizeLatitude(to.latitude);
  const toLng = normalizeLongitude(to.longitude);

  if (
    fromLat === null ||
    fromLng === null ||
    toLat === null ||
    toLng === null
  ) {
    return null;
  }

  const lat1 = degreesToRadians(fromLat);
  const lat2 = degreesToRadians(toLat);
  const dLng = degreesToRadians(toLng - fromLng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const degrees = radiansToDegrees(Math.atan2(y, x));

  return Math.round((degrees + 360) % 360);
}

function normalizeTrip(
  trip: OutdoorGlanceTripDraft | null | undefined
): OutdoorGlanceTrip | null {
  if (!trip) {
    return null;
  }

  const name = String(trip.name || '').trim();
  if (!name) {
    return null;
  }

  return {
    id: String(trip.id),
    name,
    dayNumber: normalizePositiveInteger(trip.dayNumber),
  };
}

function normalizeLocation(
  location: OutdoorGlanceLocationDraft | null | undefined,
  fallbackDate: Date | null
): OutdoorGlanceLocation | null {
  if (!location) {
    return null;
  }

  const latitude = normalizeLatitude(location.latitude);
  const longitude = normalizeLongitude(location.longitude);
  if (latitude === null || longitude === null) {
    return null;
  }

  const capturedAt = normalizeRequiredDate(location.capturedAt, fallbackDate);
  if (!capturedAt) {
    return null;
  }

  return {
    name: normalizeString(location.name),
    latitude,
    longitude,
    horizontalAccuracyMeters: normalizeNonNegativeNumber(
      location.horizontalAccuracyMeters
    ),
    capturedAt,
  };
}

function normalizeAltitude(
  altitude: OutdoorGlanceAltitudeDraft | null | undefined,
  fallbackDate: Date | null
): OutdoorGlanceAltitude | null {
  if (!altitude) {
    return null;
  }

  const meters = normalizeFiniteNumber(altitude.meters);
  if (meters === null) {
    return null;
  }

  const capturedAt = normalizeRequiredDate(altitude.capturedAt, fallbackDate);
  if (!capturedAt) {
    return null;
  }

  return {
    meters,
    verticalAccuracyMeters: normalizeNonNegativeNumber(
      altitude.verticalAccuracyMeters
    ),
    capturedAt,
  };
}

function normalizeWeather(
  weather: OutdoorGlanceWeatherDraft | null | undefined,
  fallbackDate: Date | null
): OutdoorGlanceWeather | null {
  if (!weather) {
    return null;
  }

  const updatedAt = normalizeRequiredDate(weather.updatedAt, fallbackDate);
  if (!updatedAt) {
    return null;
  }

  return {
    temperatureCelsius: normalizeFiniteNumber(weather.temperatureCelsius),
    apparentTemperatureCelsius: normalizeFiniteNumber(
      weather.apparentTemperatureCelsius
    ),
    conditionCode: normalizeString(weather.conditionCode),
    precipitationProbability: normalizeProbability(
      weather.precipitationProbability
    ),
    updatedAt,
  };
}

function normalizeSun(
  sun: OutdoorGlanceSunDraft | null | undefined
): OutdoorGlanceSun | null {
  if (!sun) {
    return null;
  }

  const sunriseAt = normalizeOptionalDate(sun.sunriseAt);
  const sunsetAt = normalizeOptionalDate(sun.sunsetAt);

  if (!sunriseAt && !sunsetAt) {
    return null;
  }

  return {
    sunriseAt,
    sunsetAt,
  };
}

function normalizeActivity(
  activity: OutdoorGlanceActivityDraft | null | undefined,
  fallbackDate: Date | null
): OutdoorGlanceActivity | null {
  if (!activity) {
    return null;
  }

  const updatedAt = normalizeRequiredDate(activity.updatedAt, fallbackDate);
  if (!updatedAt) {
    return null;
  }

  return {
    steps: normalizeNonNegativeInteger(activity.steps),
    distanceMeters: normalizeNonNegativeNumber(activity.distanceMeters),
    updatedAt,
  };
}

function normalizeParking(
  parking: OutdoorGlanceParkingDraft | null | undefined
): OutdoorGlanceParking | null {
  if (!parking) {
    return null;
  }

  const latitude = normalizeLatitude(parking.latitude);
  const longitude = normalizeLongitude(parking.longitude);
  const savedAt = normalizeOptionalDate(parking.savedAt);
  if (latitude === null || longitude === null || !savedAt) {
    return null;
  }

  return {
    savedAt,
    latitude,
    longitude,
    distanceMeters: normalizeNonNegativeNumber(parking.distanceMeters),
    bearingDegrees: normalizeBearing(parking.bearingDegrees),
  };
}

function normalizeRequiredDate(
  value: DateLike | null | undefined,
  fallbackDate: Date | null
): string | null {
  const parsed = toDate(value);
  if (parsed) {
    return toIsoString(parsed);
  }

  return fallbackDate ? toIsoString(fallbackDate) : null;
}

function normalizeOptionalDate(value: DateLike | null | undefined): string | null {
  const parsed = toDate(value);
  return parsed ? toIsoString(parsed) : null;
}

function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  return numberValue !== null && numberValue >= 0 ? numberValue : null;
}

function normalizePositiveInteger(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  if (numberValue === null || numberValue <= 0) {
    return null;
  }

  return Math.floor(numberValue);
}

function normalizeNonNegativeInteger(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  if (numberValue === null || numberValue < 0) {
    return null;
  }

  return Math.floor(numberValue);
}

function normalizeLatitude(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  return numberValue !== null && numberValue >= -90 && numberValue <= 90
    ? numberValue
    : null;
}

function normalizeLongitude(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  return numberValue !== null && numberValue >= -180 && numberValue <= 180
    ? numberValue
    : null;
}

function normalizeProbability(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  if (numberValue === null) {
    return null;
  }

  return numberValue >= 0 && numberValue <= 1 ? numberValue : null;
}

function normalizeBearing(value: unknown): number | null {
  const numberValue = normalizeFiniteNumber(value);
  if (numberValue === null) {
    return null;
  }

  return ((numberValue % 360) + 360) % 360;
}

function toDate(value: DateLike | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function toIsoString(date: Date): string {
  return date.toISOString();
}

function createUuid(): string {
  const maybeCrypto = globalThis.crypto as
    | { randomUUID?: () => string }
    | undefined;

  if (typeof maybeCrypto?.randomUUID === 'function') {
    return maybeCrypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
