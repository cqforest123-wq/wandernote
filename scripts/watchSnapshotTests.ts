import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  composeOutdoorGlanceSnapshot,
  fingerprintOutdoorGlanceInput,
} from '../lib/watch/composeOutdoorGlanceSnapshot';
import {
  makeOutdoorGlanceSnapshotInputFromAppState,
  selectOutdoorGlanceTrip,
} from '../lib/watch/OutdoorGlanceAppStateAdapter';
import { OutdoorGlanceSyncCoordinator } from '../lib/watch/OutdoorGlanceSyncCoordinator';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertWithin(
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${message}: expected ${expected} +/- ${tolerance}, got ${actual}`
    );
  }
}

async function testComposer(): Promise<void> {
  const now = new Date('2026-06-27T00:00:00.000Z');
  const snapshot = composeOutdoorGlanceSnapshot({
    now,
    trip: {
      id: 123,
      name: 'Kyoto, Japan',
      dayNumber: 2,
    },
    location: {
      name: 'Kyoto Station',
      latitude: '35.0116',
      longitude: '135.7681',
    },
    weather: {
      temperatureCelsius: '24.4',
      apparentTemperatureCelsius: null,
      conditionCode: 2,
      precipitationProbability: 0.2,
    },
    parking: {
      savedAt: '2026-06-26T23:30:00.000Z',
      latitude: 35.01,
      longitude: 135.76,
      distanceMeters: 920,
      bearingDegrees: -10,
    },
  });

  assertEqual(snapshot.schemaVersion, 1, 'schema version matches v1');
  assert(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      snapshot.snapshotId
    ),
    'snapshotId is a UUID v4'
  );
  assertEqual(snapshot.generatedAt, now.toISOString(), 'generatedAt is ISO');
  assertEqual(
    snapshot.freshness.validUntil,
    '2026-06-27T00:30:00.000Z',
    'freshness uses default TTL'
  );
  assertEqual(snapshot.trip?.id, '123', 'trip id is stringified');
  assertEqual(snapshot.trip?.dayNumber, 2, 'trip day is preserved');
  assertEqual(snapshot.location?.latitude, 35.0116, 'latitude is normalized');
  assertEqual(
    snapshot.location?.capturedAt,
    now.toISOString(),
    'destination capturedAt falls back to generatedAt'
  );
  assertEqual(
    snapshot.weather?.conditionCode,
    '2',
    'weather condition code is stringified'
  );
  assertEqual(snapshot.altitude, null, 'missing altitude remains null');
  assertEqual(snapshot.sun, null, 'missing sun remains null');
  assertEqual(snapshot.activity, null, 'missing activity remains null');
  assertEqual(snapshot.parking?.bearingDegrees, 350, 'bearing is normalized');

  const json = JSON.stringify(snapshot);
  assert(!json.includes('undefined'), 'snapshot JSON never contains undefined');

  const invalid = composeOutdoorGlanceSnapshot({
    now,
    trip: { id: 1, name: 'Invalid Coords' },
    location: {
      name: 'Nowhere',
      latitude: 200,
      longitude: 135,
    },
    weather: {
      temperatureCelsius: Number.NaN,
    },
  });
  assertEqual(invalid.location, null, 'invalid coordinates produce null');
  assertEqual(invalid.weather?.temperatureCelsius, null, 'NaN becomes null');
}

function testAppStateAdapter(): void {
  const now = new Date(2026, 5, 27);
  const trips = [
    {
      id: 1,
      city: 'Paris',
      country: 'France',
      date: '2026.01',
      plannedDate: '2026.06.30',
      coords: { lat: 48.8566, lng: 2.3522 },
      days: [],
    },
    {
      id: 2,
      city: 'Tokyo',
      country: 'Japan',
      date: '2026.05',
      plannedDate: '2026.06.28',
      coords: { lat: 35.6762, lng: 139.6503 },
      days: [],
    },
  ];

  assertEqual(
    selectOutdoorGlanceTrip(trips, now)?.id,
    2,
    'nearest upcoming trip is selected'
  );

  const input = makeOutdoorGlanceSnapshotInputFromAppState({
    trips: [
      {
        id: 3,
        city: 'Seoul',
        country: 'Korea',
        date: '2026.06',
        plannedDate: '2026.06.26',
        coords: { lat: 37.5665, lng: 126.978 },
        days: [{ date: '2026.06.26' }, { date: '2026.06.27' }],
      },
    ],
    now,
  });

  assertEqual(input.trip?.name, 'Seoul, Korea', 'trip name is composed');
  assertEqual(input.trip?.dayNumber, 2, 'day number uses matching trip day');
  assertEqual(
    input.location?.name,
    'Seoul, Korea',
    'destination location uses trip name'
  );
}

function testGeoHelpers(): void {
  const distance = calculateDistanceMeters(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 }
  );
  assert(distance !== null, 'distance is calculated');
  assertWithin(distance, 111195, 250, 'distance uses haversine meters');

  const bearing = calculateBearingDegrees(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 }
  );
  assertEqual(bearing, 90, 'eastward bearing is 90 degrees');
}

async function testCoordinator(): Promise<void> {
  const input = {
    now: '2026-06-27T00:00:00.000Z',
    trip: { id: 1, name: 'Lisbon, Portugal' },
    location: {
      name: 'Lisbon',
      latitude: 38.7223,
      longitude: -9.1393,
    },
  };
  const sameBusinessLater = {
    ...input,
    now: '2026-06-27T00:10:00.000Z',
  };

  assertEqual(
    fingerprintOutdoorGlanceInput(input),
    fingerprintOutdoorGlanceInput(sameBusinessLater),
    'fingerprint ignores generatedAt changes'
  );

  const published: string[] = [];
  const coordinator = new OutdoorGlanceSyncCoordinator({
    debounceMs: 0,
    publisher: snapshotJson => {
      published.push(snapshotJson);
    },
  });

  coordinator.schedule(input);
  await coordinator.flush();
  coordinator.schedule(sameBusinessLater);
  await coordinator.flush();
  coordinator.schedule(sameBusinessLater, { force: true });
  await coordinator.flush();
  coordinator.dispose();

  assertEqual(published.length, 2, 'dedupe skips same input unless forced');
  assertEqual(
    JSON.parse(published[0]).trip.name,
    'Lisbon, Portugal',
    'publisher receives serialized snapshot'
  );

  let errorCount = 0;
  const failingCoordinator = new OutdoorGlanceSyncCoordinator({
    debounceMs: 0,
    publisher: () => {
      throw new Error('publish failed');
    },
    onError: () => {
      errorCount += 1;
    },
  });

  failingCoordinator.schedule(input);
  await failingCoordinator.flush();
  failingCoordinator.dispose();
  assertEqual(errorCount, 1, 'publish errors are reported without throwing');
}

async function main(): Promise<void> {
  await testComposer();
  testAppStateAdapter();
  testGeoHelpers();
  await testCoordinator();
  console.log('watch snapshot tests passed');
}

main().catch(error => {
  console.error(error);
  throw error;
});
