export const OUTDOOR_GLANCE_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const OUTDOOR_GLANCE_DEFAULT_TTL_MS = 30 * 60 * 1000;

export type ISODateString = string;

export type OutdoorGlanceSnapshot = {
  schemaVersion: typeof OUTDOOR_GLANCE_SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  generatedAt: ISODateString;
  freshness: OutdoorGlanceFreshness;
  trip: OutdoorGlanceTrip | null;
  location: OutdoorGlanceLocation | null;
  altitude: OutdoorGlanceAltitude | null;
  weather: OutdoorGlanceWeather | null;
  sun: OutdoorGlanceSun | null;
  activity: OutdoorGlanceActivity | null;
  parking: OutdoorGlanceParking | null;
  /** Language selected inside the iPhone app, so the watch can match it. */
  language: string | null;
  /** Today's spend, already formatted in the home currency. */
  todaySpendText: string | null;
  /** Whether the user's region is metric, decided on the phone. */
  usesMetric: boolean | null;
};

export type OutdoorGlanceFreshness = {
  validUntil: ISODateString;
};

export type OutdoorGlanceTrip = {
  id: string;
  name: string;
  dayNumber: number | null;
};

export type OutdoorGlanceLocation = {
  name: string | null;
  latitude: number;
  longitude: number;
  horizontalAccuracyMeters: number | null;
  capturedAt: ISODateString;
};

export type OutdoorGlanceAltitude = {
  meters: number;
  verticalAccuracyMeters: number | null;
  capturedAt: ISODateString;
};

export type OutdoorGlanceWeather = {
  temperatureCelsius: number | null;
  apparentTemperatureCelsius: number | null;
  conditionCode: string | null;
  precipitationProbability: number | null;
  updatedAt: ISODateString;
};

export type OutdoorGlanceSun = {
  sunriseAt: ISODateString | null;
  sunsetAt: ISODateString | null;
};

export type OutdoorGlanceActivity = {
  steps: number | null;
  distanceMeters: number | null;
  updatedAt: ISODateString;
};

export type OutdoorGlanceParking = {
  savedAt: ISODateString;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  bearingDegrees: number | null;
};

export type DateLike = Date | string | number;

export type OutdoorGlanceTripDraft = {
  id: string | number;
  name: string;
  dayNumber?: number | null;
};

export type OutdoorGlanceLocationDraft = {
  name?: string | null;
  latitude: number | string;
  longitude: number | string;
  horizontalAccuracyMeters?: number | string | null;
  capturedAt?: DateLike | null;
};

export type OutdoorGlanceAltitudeDraft = {
  meters: number | string;
  verticalAccuracyMeters?: number | string | null;
  capturedAt?: DateLike | null;
};

export type OutdoorGlanceWeatherDraft = {
  temperatureCelsius?: number | string | null;
  apparentTemperatureCelsius?: number | string | null;
  conditionCode?: string | number | null;
  precipitationProbability?: number | string | null;
  updatedAt?: DateLike | null;
};

export type OutdoorGlanceSunDraft = {
  sunriseAt?: DateLike | null;
  sunsetAt?: DateLike | null;
};

export type OutdoorGlanceActivityDraft = {
  steps?: number | string | null;
  distanceMeters?: number | string | null;
  updatedAt?: DateLike | null;
};

export type OutdoorGlanceParkingDraft = {
  savedAt?: DateLike | null;
  latitude: number | string;
  longitude: number | string;
  distanceMeters?: number | string | null;
  bearingDegrees?: number | string | null;
};

export type ComposeOutdoorGlanceSnapshotInput = {
  now?: DateLike;
  ttlMs?: number;
  trip?: OutdoorGlanceTripDraft | null;
  location?: OutdoorGlanceLocationDraft | null;
  altitude?: OutdoorGlanceAltitudeDraft | null;
  weather?: OutdoorGlanceWeatherDraft | null;
  sun?: OutdoorGlanceSunDraft | null;
  activity?: OutdoorGlanceActivityDraft | null;
  parking?: OutdoorGlanceParkingDraft | null;
  language?: string | null;
  todaySpendText?: string | null;
  usesMetric?: boolean | null;
};
