# OutdoorGlanceSnapshot v1

## Purpose

OutdoorGlanceSnapshot is the only versioned data contract exchanged between the WanderNote iPhone app and Apple Watch.

The iPhone generates the snapshot. The Watch receives, caches, evaluates freshness, and renders it.

## Data flow

iPhone outdoor services
→ OutdoorGlanceSnapshot v1
→ WatchConnectivity application context
→ Watch local cache
→ SwiftUI views

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

## Non-goals for v1

- Turn-by-turn navigation
- Route recording
- Full trip database synchronization
- AI generation on Watch
- Photo transfer
- WidgetKit complications
