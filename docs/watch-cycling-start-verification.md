# Start Cycling From iPhone

Branch: `feature/watch-companion-v1-integration`

## Behavior

- The iPhone home screen offers **Start Cycling on Apple Watch**, including when there
  are no trips. The control is hidden on iPad and non-iOS platforms.
- The existing React Native bridge calls HealthKit's
  [`startWatchApp(with:completion:)`](https://developer.apple.com/documentation/healthkit/hkhealthstore/startwatchapp(with:completion:))
  with an outdoor cycling configuration. It requires a paired Watch with WanderNote installed.
- A successful iPhone callback confirms that the start request was sent. It does not
  confirm that Watch authorization or workout startup has completed. The phone says to
  check Watch status instead of claiming a workout is running.
- The Watch application delegate receives the configuration. A single retained
  coordinator requests workout write access on Watch, checks the actual authorization
  status, creates the HealthKit session and builder, and starts collection.
- Watch shows **Cycling active** only after collection starts. Repeated launch requests
  are ignored during authorization, startup, an active ride, and saving.
- **End Cycling** ends the session and saves the workout. Startup, collection, and save
  failures leave a visible failure state. Session startup and saving have a 30-second
  deadline; a late callback from an earlier session cannot overwrite a newer session.
- The phone request has a 20-second deadline and releases its busy state on failure.
  A timeout can occur after Watch has received the request; the error text asks users
  to check the Watch before retrying.
- The feature starts a workout in WanderNote's companion app, not Apple's Workout app.
  It does not add a separate iPhone workout recorder, route recorder, or phone-side
  live workout mirroring. Existing Travel/Daily/Parking display remains available.

## Configuration

- iPhone and Watch have the HealthKit entitlement and health privacy descriptions.
- `ios/WatchCompanion-Info.plist` supplies `WKBackgroundModes` as an array containing
  `workout-processing`. A generated scalar build setting alone did not emit this key,
  so the built plist must be inspected.
- Bundle identifiers, signing team, minimum OS versions, app version, and build number
  are unchanged.

## Automated Verification

- `npm run check`
- `npm run check:watch`, including the five cycling bridge tests (unsupported/old native
  builds, success, rejection, synchronous failure, and timeout/late completion/retry).
- Expo iOS JavaScript export to a temporary directory, validating the new screen import
  and translations.
- Watch target and WanderNote scheme Debug simulator builds.
- `git diff --check`

These checks do not verify Watch wake-up, the Health permission sheet, sensor collection,
or a saved workout on physical hardware.

## Device Preparation On 2026-10-14

- CoreDevice reported the iPhone 14 Pro Max and Apple Watch Series 11 as available and
  paired. The physical iPhone Debug scheme build passed, with the updated Watch app
  embedded.
- The first signed build found that the existing iPhone provisioning profile lacked
  HealthKit. Rebuilding with Xcode automatic provisioning updates succeeded. Both
  signed app bundles contain `com.apple.developer.healthkit = true`; signing team and
  bundle IDs remain unchanged.
- For the physical installation, a temporary copy of the Debug app includes an Expo
  JavaScript bundle and its assets. It was re-signed using the same Apple Development
  identity and original entitlements, and strict signature verification passed. This
  allows React Native's existing bundled-resource fallback to load without Metro.
  The copy is `/tmp/wandernote-cycling-device/WanderNote.app`; no generated assets or
  signing material were added to Git.
- Installation and process launch of that updated iPhone app succeeded. This does not
  confirm that the workout button was tapped or that Watch startup succeeded.
  Direct Watch installation still
  failed with CoreDevice error 4000 / RemotePairing error 1001: the remote pairing
  tunnel timed out. The Watch may install through its paired iPhone, but that has not
  been confirmed.
- Pre-existing version metadata differs: `app.json` and Xcode build settings say
  `1.0.2 (10)`, the iPhone's source `Info.plist` hardcodes `1.0.0 (1)`, and the built
  Watch reports `1.0.2 (10)`. CoreDevice confirmed the installed iPhone app as
  `1.0.0 (1)`. These values were left unchanged as instructed. Resolve this discrepancy
  separately before any distribution build; it may also affect paired installation.

## Paired Physical Device Acceptance

1. Install the updated iPhone and Watch development apps. Existing installed binaries
   do not contain the new native bridge or workout handler. Ordinary Xcode Debug builds
   use this worktree's Metro server. The prepared temporary development copy described
   above also contains an offline JavaScript bundle.
2. Wear and unlock the paired Watch. On iPhone, open WanderNote's home screen and tap
   **Start Cycling on Apple Watch**. Expect the request status on phone and WanderNote
   opening on Watch.
3. Allow workout write access on Watch. Expect **Cycling active** with elapsed time.
   Allowing daily step reading alone is not workout write authorization.
4. Repeat the phone command during the same ride. Expect one active workout, with its
   original start time unchanged.
5. Lower the wrist, then reopen the companion. Expect the workout to remain active.
6. Tap **End Cycling** on Watch. Expect saving to finish and exactly one cycling workout
   in Health/Fitness. Verify actual saved data before claiming recording is complete.
7. Start another ride after the previous one finishes. Expect normal startup again.
8. Deny workout write access and try to start. Expect **Workout permission needed**,
   with no running session or false active state. Enable access, then retry from phone.
9. Disconnect the Watch or test without the companion installed. Expect a bounded
   phone error and an enabled retry button, with no change to trip data.

Physical acceptance remains pending until these steps are observed on the paired devices.
