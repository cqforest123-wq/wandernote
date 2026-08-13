# Watch Companion — Non-Device Completion Report

Scope: Mac-only, non-device completion pass on `feature/watch-companion-v1-integration`.
No physical iPhone or Apple Watch was used to produce this report. Everything below was
verified with unit/CLI test scripts, `tsc`, Swift compiler checks, and `xcodebuild` against
Simulator destinations only.

Repo: `/Users/litao/Developer/wandernote-watch`
Branch: `feature/watch-companion-v1-integration`
Base commit for this pass: `0147c35` (chore: add watch diagnostics for device testing)
Re-verified as of commit `1806854` (docs: add watch non-device completion report) — see §11.

## 1. Current Functional Scope

- `OutdoorGlanceSnapshot v1` JS↔native contract for Travel Mode (trip, location, altitude,
  weather, sun, parking, steps).
- Daily Mode fallback (`DailyGlanceStore`) when no iPhone snapshot is available, sourced from
  on-Watch Location, HealthKit steps, and locally saved parking.
- Stale-snapshot handling (`GlanceMode.stale`) when a Travel snapshot has expired its TTL.
- Unavailable state when neither a snapshot nor daily data exists yet.
- On-Watch parking save/clear and "Back to Parking" Apple Maps deep link.
- WatchConnectivity sync path: debounce, payload fingerprint de-duplication, and foreground
  resync on the iPhone side.
- DEBUG-only `[WatchGlance]` / `[OutdoorGlance]` diagnostic logging (no full coordinates
  logged; gated out of Release via `#if DEBUG`).

This pass did not add new product features. It closed non-device completeness gaps only:
SwiftUI previews and this report.

## 2. Test Coverage (this pass)

All commands run from `/Users/litao/Developer/wandernote-watch`:

| Command | Result |
|---|---|
| `npm run test:watch-snapshot` | passed |
| `npm run test:watch-glance` | passed (pre-existing `Locale.languageCode`/`scriptCode`/`regionCode` deprecation warnings in `WatchStrings.swift`, no failures) |
| `npm run test:watch-parking` | passed |
| `npm run test:watch-sun` | passed |
| `npm run check` (`tsc --noEmit`) | passed |
| `git diff --check` | clean, no whitespace errors |

These are CLI-level Swift/TypeScript checks (`swiftc` compiling isolated Watch source files
against hand-written test drivers in `scripts/`), not Xcode builds or app runs.

## 3. Build Verification (this pass)

Ran via `xcodebuild -workspace ios/WanderNote.xcworkspace`, all against Simulator
destinations (no physical device destination was used or attempted):

| Scheme | Configuration | Destination | Result |
|---|---|---|---|
| `WanderNote` | Debug | `platform=iOS Simulator,name=iPhone 17 Pro` | **BUILD SUCCEEDED** |
| `WanderNote` | Release | `platform=iOS Simulator,name=iPhone 17 Pro` | **BUILD SUCCEEDED** |
| `TravelWatchCompanion Watch App` | Debug | `platform=watchOS Simulator,name=Apple Watch Series 11 (46mm)` | **BUILD SUCCEEDED** |
| `TravelWatchCompanion Watch App` | Release | `platform=watchOS Simulator,name=Apple Watch Series 11 (46mm)` | **BUILD SUCCEEDED** |

Both `WanderNote` scheme builds embed and validate the Watch app target
(`ValidateEmbeddedBinary … TravelWatchCompanion Watch App.app`), so the new
`GlanceContentView.swift` preview file was compiled as part of every one of the four builds
above.

`-allowProvisioningUpdates` was **not used and was not required** — all four builds used
Simulator destinations with ad-hoc "Sign to Run Locally" signing. No signing team,
bundle identifier, version, or build number was changed (`DEVELOPMENT_TEAM = V5746UM5UL`,
`MARKETING_VERSION = 1.0.2`, `CURRENT_PROJECT_VERSION = 10` unchanged; verified before and
after this pass).

`xcodebuild -showdestinations` for the Watch scheme confirms the real paired Watch is
currently **ineligible** for a device build:

```
Ineligible destinations for the "TravelWatchCompanion Watch App" scheme:
    { platform:watchOS, arch:arm64e, id:00008310-0000B5CC0E10E01E, name:李涛的Apple Watch,
      error:李涛的Apple Watch doesn't have a known architecture. }
```

This is a known blocker (see §6) and is why this pass verified builds via Simulator
destinations instead of a real-device destination.

No generic device (`Any iOS Device` / `Any watchOS Device`) or archive build was attempted,
since that path is closer to provisioning/signing territory that this pass was told not to
touch.

## 4. What Is Proven By Static Checks, Tests, And Compilation Alone

- Swift logic units (`GlanceDataMapper`, `SunEventCalculator`, `ParkingStore`, `GeoDistance`,
  `OutdoorGlanceSnapshotStore`) behave correctly against their test-double inputs, including
  nil/stale/unavailable fallback paths and polar-day/night guards.
  See `scripts/watchGlanceDataTests.swift`, `scripts/watchSunEventTests.swift`,
  `scripts/watchParkingTests.swift`.
- The JS↔native `OutdoorGlanceSnapshot v1` payload encodes/decodes and round-trips correctly
  (`npm run test:watch-snapshot`).
- The whole app (host + embedded Watch target) type-checks and compiles cleanly for both
  Debug and Release, for both iPhone and Watch, under the current Xcode toolchain and SDKs.
- The Watch glance UI (`GlanceContentView`) renders without compiler errors across 7 mock
  states (Travel, Daily, Stale, Unavailable, Location-denied, Parking saved, No parking
  saved) via SwiftUI `#Preview`.
- No Mock provider (`MockOutdoorGlanceProvider`, `MockDailyActivityProvider`,
  `MockParkingLocationProvider`, `MockSunEventProvider`) is referenced from the production
  runtime path (`WatchCompanionRuntime.swift`, `TravelWatchCompanionApp.swift`) — confirmed
  by the prior Linux-side audit and re-confirmed by grep during this pass.

## 5. What Still Requires A Real Device

Everything about actual runtime behavior on hardware is **not** covered by the above:

- App/Watch app install and cold launch on real hardware.
- Actual Location permission prompt flow and resulting authorization values.
- Actual HealthKit permission prompt flow and real step-count data.
- Real WatchConnectivity transport: pairing state, session activation, background delivery,
  `updateApplicationContext` timing, and real network/Bluetooth conditions.
- Real GPS/altitude/weather values feeding Travel Mode and Daily Mode.
- Real sunrise/sunset calculation against the device's actual location and clock.
- Real parking save/distance/"Back to Parking" Maps hand-off.
- Disconnect/reconnect, stale-cache, and cold-start behavior under real backgrounding and
  device sleep/wake.
- Visual/layout QA on an actual Watch screen (Simulator and Preview rendering can diverge
  from real hardware in subtle ways: text truncation, Digital Crown scroll feel, Complication
  rendering is out of scope but general on-device legibility is not).

**None of this was tested in this pass. Do not treat any of the above as verified.**

## 6. Known Real-Device Blockers (as previously observed)

- iPhone lock screen has caused `launch failed` when trying to install/run from Xcode.
- Watch tunnel (wireless debugging) has timed out during device communication.
- `xctrace` / `devicectl` have reported inconsistent device state between tools.
- The Watch scheme has shown the real paired Watch as `ineligible` /
  "doesn't have a known architecture" in `xcodebuild -showdestinations` (reproduced again in
  this pass — see §3).

## 7. Prerequisites Before Attempting Real-Device Testing

- iPhone unlocked, with auto-lock temporarily disabled for the test session.
- Apple Watch unlocked, worn on wrist, screen kept awake.
- Mac, iPhone, and Watch on the same ordinary Wi-Fi network.
- VPN / Tailscale / any proxy disabled on all three devices.
- Xcode → Devices and Simulators shows the iPhone and Watch as online, or `devicectl` reports
  them as available/paired.

## 8. Still Required On Real Devices (checklist)

- iPhone app launch.
- Watch app install and launch.
- Location permission grant/deny flows.
- HealthKit permission grant/deny flows.
- Travel Mode end-to-end (trip → snapshot → Watch display).
- Daily Mode end-to-end (no trip → on-Watch fallback).
- Altitude reading.
- Steps reading.
- Sunrise/sunset/daylight-remaining reading.
- Parking save, distance update, and "Back to Parking".
- WatchConnectivity delivery timing and de-duplication under real conditions.
- Disconnect / reconnect / cached-data / stale-data behavior.
- Cold start of both apps.

A structured version of this checklist already exists at
[`docs/watch-real-device-test-checklist.md`](watch-real-device-test-checklist.md) — none of
its steps have been executed as part of this non-device pass.

## 9. Merge Recommendation

- **Do not merge into `hotfix/wandernote-build4-external-test`.** That branch is a separate
  hotfix line and is out of scope for this work.
- Keep this work on `feature/watch-companion-v1-integration` as a **Build 5 / v1.1
  candidate**.
- **Do not submit to TestFlight** until the real-device checklist in §8 has been executed on
  a physically paired iPhone + Apple Watch.

## 10. Summary Statement

Non-device condition: **completed to deliverable-candidate status.**

Real iPhone + Apple Watch end-to-end testing: **not completed.** Nothing in this report
should be read as claiming Watch Companion works on real hardware — only that it type-checks,
unit-tests, and builds cleanly (Debug and Release, iPhone and Watch, Simulator destinations)
on this Mac.

## 11. Re-Verification Pass (commit `1806854`)

Ran again, after the `GlanceContentView` preview refactor landed, to confirm nothing
regressed:

- `npm run test:watch-snapshot`, `test:watch-glance`, `test:watch-parking`,
  `test:watch-sun`, `npm run check`, `git diff --check` — all passed / clean, same results
  as §2.
- `xcodebuild -list` (via `-workspace`) re-confirmed the two app schemes:
  `WanderNote` and `TravelWatchCompanion Watch App`.
- All four Simulator builds from §3 (`WanderNote` Debug/Release,
  `TravelWatchCompanion Watch App` Debug/Release) re-ran and **BUILD SUCCEEDED** again, with
  no `-allowProvisioningUpdates` used or required.
- Preview coverage was re-audited: `GlanceContentView.swift` is the only view with
  renderable state variation, and its 7 `#Preview` cases already cover Travel, Daily,
  Stale, Unavailable, Location-denied, Parking Saved, and No Parking Saved. `ContentView`
  and `TravelWatchCompanionApp` are thin environment-object wrappers with no independent
  visual state, so no further preview files were needed.

No code changes were required in this re-verification pass — it confirmed the prior pass's
result still holds. Real-device testing remains **not completed** (see §5, §8).
