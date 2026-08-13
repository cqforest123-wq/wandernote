# Watch Companion Real-Device Test Checklist

Use a paired physical iPhone and Apple Watch before merging or shipping Watch Companion changes. Run the tests on a Debug build first so `[OutdoorGlance]` and `[WatchGlance]` logs are visible in Xcode Console.

## A. Install And Permissions

1. Install WanderNote on iPhone and TravelWatchCompanion on the paired Watch.
   Expected: both apps launch without crashing.
   If failed: record device model, OS versions, build configuration, crash log, and a screenshot of the install state.

2. Launch the Watch app for the first time and accept Location permission.
   Expected: Daily Glance remains visible and location-dependent rows eventually update or show a graceful unavailable value.
   If failed: capture permission prompt state, Watch app screen, and `[WatchGlance]` location logs.

3. Launch the Watch app and accept HealthKit step-count permission.
   Expected: steps row updates when HealthKit has data, or shows unavailable without blocking the UI.
   If failed: capture Health permission screen and `[WatchGlance] HealthKit` logs.

4. Reset permissions, deny Location, and relaunch the Watch app.
   Expected: Daily Glance stays visible, Location/Altitude/Sun show unavailable or permission-denied text, no crash.
   If failed: capture Watch screen and location authorization logs.

5. Reset permissions, deny HealthKit, and relaunch the Watch app.
   Expected: steps show unavailable, all other Daily Glance rows remain usable.
   If failed: capture Watch screen and HealthKit authorization logs.

## B. WanderNote Travel Mode

1. On iPhone, create or select a current trip with destination coordinates.
   Expected: JS composes an OutdoorGlanceSnapshot v1 payload.
   If failed: record trip data shape, app screen, and `[OutdoorGlance] snapshot composed` logs.

2. Keep the iPhone app foregrounded until the snapshot sends.
   Expected: native bridge logs send requested, sender logs updateApplicationContext sent.
   If failed: capture `[OutdoorGlance] native bridge` and WatchConnectivity sender logs.

3. Open the Watch app.
   Expected: Watch receives a fresh snapshot and displays Travel Mode with trip, location, weather if available, and updated time.
   If failed: capture Watch screen, `[WatchGlance] payload received`, and cache logs.

4. Put the iPhone app in background, then foreground it again.
   Expected: foreground resync is requested and the Watch updated time refreshes after delivery.
   If failed: capture AppState logs and sender state logs.

5. Repeat the same unchanged trip state.
   Expected: duplicate payloads are skipped except forced foreground sync.
   If failed: capture duplicate-skip logs and note whether the Watch receives repeated identical payloads.

6. Let the snapshot expire past its TTL.
   Expected: Watch keeps the last data visible and shows stale status.
   If failed: capture Watch screen and `snapshot considered stale` logs.

## C. Daily Mode

1. Clear or avoid any current trip snapshot, then cold-launch the Watch app.
   Expected: Daily Glance appears instead of a blank screen.
   If failed: capture Watch screen and `Daily fallback selected` logs.

2. With Location allowed, wait for a location update.
   Expected: location coordinates/name fallback, altitude if vertical accuracy is available, and sun rows update.
   If failed: capture location logs, altitude logs, and Watch screen.

3. With Location denied or unavailable, relaunch the Watch app.
   Expected: location, altitude, and sun rows show unavailable states without crash.
   If failed: capture authorization state and unavailable reason logs.

4. With HealthKit allowed and step data present, refresh the Watch app.
   Expected: steps row shows today's step count.
   If failed: capture HealthKit query logs and Health permission state.

5. With HealthKit unavailable, denied, or no samples, refresh the Watch app.
   Expected: steps row shows unavailable and the rest of the screen remains usable.
   If failed: capture HealthKit unavailable/denied/no-data logs.

6. Test sun calculation after local sunset or in a polar/edge location if possible.
   Expected: sunset may show unavailable and daylight left may show unavailable without blocking UI.
   If failed: capture sun unavailable reason logs.

## D. Parking

1. On Watch, tap Save Parking while Location is authorized and available.
   Expected: parking row shows saved/0 m, and logs show parking saved.
   If failed: capture Watch screen and parking save logs.

2. Move away from the saved point or simulate a changed location.
   Expected: parking distance changes after the next location refresh.
   If failed: capture current location logs and parking distance logs.

3. Tap Back to Parking.
   Expected: Apple Maps opens with directions to the saved point, or the system gracefully refuses if Maps is unavailable.
   If failed: capture Watch screen and the URL-opening result if Xcode reports one.

4. Save Parking again at a new location.
   Expected: the previous parking point is overwritten clearly and distance resets near zero.
   If failed: capture saved time, distance, and parking storage logs.

5. Verify iPhone trip parking data, if present elsewhere in the app.
   Expected: Watch-local parking does not modify WanderNote trip parking data.
   If failed: capture before/after iPhone screens and any JS/native logs.

## E. Weak Network And Offline

1. Disable iPhone network while a trip is selected.
   Expected: snapshot still sends with trip/location data; weather may be unavailable.
   If failed: capture `[OutdoorGlance] destination weather unavailable` and send logs.

2. Temporarily separate Watch and iPhone or disable Bluetooth/Wi-Fi.
   Expected: latest pending snapshot is retained and Watch keeps cached data or Daily Glance.
   If failed: capture WatchConnectivity sender state logs.

3. Reconnect devices.
   Expected: pending or foreground-forced snapshot delivery resumes.
   If failed: capture sender activation/watch-state logs and Watch receiver logs.

4. Cold-launch Watch while disconnected.
   Expected: cached snapshot or Daily Glance displays; no blank screen.
   If failed: capture cache load logs and Watch screen.

## F. Power And Background

1. Let Watch screen sleep, then wake it.
   Expected: UI refreshes time-sensitive rows and remains scrollable.
   If failed: capture Watch screen and recent logs.

2. Background and foreground iPhone app.
   Expected: foreground resync happens once and does not spam duplicate sends.
   If failed: capture foreground and duplicate-skip logs.

3. Force-quit and cold-launch Watch app.
   Expected: runtime starts once, cache loads once, Daily providers start without duplicate permission prompts.
   If failed: capture runtime, receiver, provider logs.

4. Force-quit and cold-launch iPhone app.
   Expected: OutdoorGlanceWatchRuntime starts once and snapshots can still publish after JS state loads.
   If failed: capture AppDelegate/startup logs and JS sync logs.

5. Leave both apps unused for several hours, then reopen Watch.
   Expected: last updated and stale status are understandable; no crash.
   If failed: capture Watch screen, stale logs, and cache logs.

## G. Regression

1. Open WanderNote core screens: Home, trip create/edit, trip detail, packing, memo, profile.
   Expected: core screens behave as before.
   If failed: capture screen recording and JS console logs.

2. Create and edit a trip.
   Expected: trip state updates and Watch snapshot scheduling still works.
   If failed: capture trip data, snapshot input logs, and app screen.

3. Verify Watch snapshot sync after a trip edit.
   Expected: Watch receives new Travel Mode data after debounce.
   If failed: capture sender/receiver logs and the Watch updated time.

4. Scroll Watch UI on small and large Watch sizes.
   Expected: no overlapping rows, no inaccessible parking buttons, no obvious performance jank.
   If failed: capture screenshots for each Watch size.

5. Run with no network, no Location permission, and no HealthKit permission together.
   Expected: the Watch app still shows a usable fallback screen and no crash.
   If failed: capture all permission states, Watch screen, and recent logs.
