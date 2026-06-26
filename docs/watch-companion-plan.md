# WanderNote Watch Companion Plan

## Product direction

The watch app starts as a WanderNote companion, but its architecture should remain brand-neutral so it can later become a standalone outdoor travel app.

## Initial modules

- Outdoor Glance
- Sun Events
- Return to Car
- Daily Steps

## Architecture rules

- Watch UI is native SwiftUI.
- Keep core model names brand-neutral.
- Avoid hardcoded user-facing strings.
- Support English, Simplified Chinese, and Traditional Chinese from day one.
- Do not add maps, route navigation, AI, or community features in the first phase.

## Current status

- Native iOS project is now tracked because Watch App and future WidgetKit targets live under ios/.
- TravelWatchCompanion Watch App target has been created.
- Shared OutdoorGlanceSnapshot v1 contract is compiled into both iPhone and Watch targets.
- Watch app receives snapshots through WatchConnectivity, caches the latest valid snapshot, evaluates freshness, and renders fresh/stale/unavailable states.
- Watch UI uses OutdoorGlanceSnapshotStore at runtime. Mock providers remain available for preview and test support only.
- iPhone starts one OutdoorGlanceWatchRuntime from AppDelegate and publishes through a narrow React Native bridge.
- JavaScript app state now composes real OutdoorGlanceSnapshot v1 payloads and schedules debounced/deduplicated syncs after load, app foreground, trip changes, and weather updates.
- Watch localization currently supports en, zh-Hans, and zh-Hant.
- Watch target and iPhone scheme compilation have been verified locally with code signing disabled.

## Pending

- Add real location altitude provider.
- Add HealthKit steps provider.
- Add Sun Events provider.
- Add Return to Car storage and distance calculation.
- Verify end-to-end delivery on a paired physical iPhone and Apple Watch.
- Add WidgetKit complication later.
