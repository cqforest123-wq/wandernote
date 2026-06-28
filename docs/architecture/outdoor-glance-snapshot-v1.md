# OutdoorGlanceSnapshot v1

## Purpose

OutdoorGlanceSnapshot is the only versioned data contract exchanged between the WanderNote iPhone app and Apple Watch.

The iPhone generates the snapshot. The Watch receives, caches, evaluates freshness, and renders it.

## Data flow

WanderNote JS app state
-> OutdoorGlanceSnapshot v1 composer
-> OutdoorGlanceWatchBridge
-> OutdoorGlanceWatchSender
-> WCSession.updateApplicationContext
-> WatchConnectivitySnapshotReceiver
-> OutdoorGlanceSnapshotStore
-> SwiftUI views

The native sender is started once from AppDelegate through OutdoorGlanceWatchRuntime. The React Native bridge publishes JSON to the same long-lived sender instance, and the sender revalidates the payload by decoding it with the shared Swift contract before calling WatchConnectivity.

## Architecture boundaries

1. The iPhone app generates the snapshot.
2. The Watch does not directly read Trip, Journal, Packing, Memo, or AI models.
3. The contract transports raw values, not localized display strings.
4. Distances and altitude use meters.
5. Temperature uses Celsius.
6. Bearings use degrees.
7. Dates use ISO 8601 UTC strings.
8. Missing information is represented by null.
9. A stale snapshot remains visible with a stale indicator.
10. Breaking changes require a new schema version.

## Transport

Version 1 uses WCSession.updateApplicationContext because the Watch needs the latest complete state rather than every intermediate update.

The sender keeps only the latest pending snapshot. If the session is not active, the watch is not paired, or the watch app is not installed, the latest snapshot remains pending and is retried after activation or watch-state changes. Non-iOS runtimes and iOS runtimes without the native bridge safely no-op.

## iPhone Snapshot Sources

- trip: selected from existing WanderNote trips. The selector matches the Home countdown behavior by preferring the nearest upcoming planned trip; if there is no upcoming trip, it uses the newest trip by trip month.
- location: the active trip destination coordinates from `trip.coords`. This is destination data, not live device location.
- weather: current destination weather from the existing Open-Meteo helper.
- altitude: null until a real altitude provider exists.
- sun: null until a real sun event provider exists.
- activity: null in the iPhone-generated snapshot for now.
- parking: null until a real return-to-car data source exists.

The composer normalizes invalid, missing, or non-finite values to null instead of sending fabricated values.

Daily Glance altitude is sourced on the Watch with CoreLocation when permission and device data are available. Simulators, denied permissions, and locations without vertical accuracy show an unavailable value instead of a fabricated altitude.

Daily Glance parking is stored locally on the Watch. The user can save the current watch location as the parking point, view distance from the latest watch location, and open Apple Maps directions. This does not require syncing trip, journal, packing, memo, or AI data to the Watch.

Daily Glance sun events are calculated locally on the Watch from the latest authorized location. The calculator has no network dependency and returns empty sunrise/sunset values for invalid coordinates or polar edge cases instead of blocking the UI.

Daily Glance steps are read locally on the Watch through HealthKit when health data is available and the user authorizes read access to step count. If HealthKit is unavailable, unauthorized, or not enabled for the target, the Watch shows an unavailable value and continues rendering. Before device distribution, confirm the Watch target has the HealthKit capability and matching provisioning profile.

## Sync Triggers

The iPhone schedules a snapshot after trip state loads, when trip data changes, when destination weather resolves, and when the app returns to the foreground.

Publishing is debounced and deduplicated by a stable fingerprint that ignores generatedAt while preserving data changes. Foreground sync can force a fresh publish to refresh the Watch cache freshness window.

## Validation

- JavaScript/TypeScript check: `npm run check`
- Snapshot sync tests: `npm run test:watch-snapshot`
- iPhone native bridge build: `xcodebuild -workspace ios/WanderNote.xcworkspace -scheme WanderNote -configuration Debug -sdk iphonesimulator ... build`
- Watch target build: `xcodebuild -project ios/WanderNote.xcodeproj -target "TravelWatchCompanion Watch App" -configuration Debug -sdk watchsimulator ... build`

## Non-goals for v1

- Turn-by-turn navigation
- Route recording
- Full trip database synchronization
- AI generation on Watch
- Photo transfer
- WidgetKit complications
