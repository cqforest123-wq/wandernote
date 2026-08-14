# iOS signing notes

## Team ID

`V5746UM5UL`

Confirmed from the live provisioning profile for `com.litao0729.wandernote`
(valid to 2027-06-08) in `~/Library/Developer/Xcode/UserData/Provisioning Profiles/`.

Do not use `JH744467DZ`. That is an older team that signed the 2026-04-29
archive; the account has since moved. A stale archive's Info.plist is not a
reliable source for the current team — the provisioning profiles are.

Registered bundle IDs under this team:

- `com.litao0729.wandernote`
- `com.litao0729.wandernote.watchkitapp` (already registered, for the parked
  Watch companion)

## The prebuild trap

`/ios` is gitignored and fully generated. `npx expo prebuild` — especially with
`--clean` — rewrites `WanderNote.xcodeproj` and **drops `DEVELOPMENT_TEAM`**,
because that setting does not live in `app.json` and Expo has nothing to
restore it from.

Simulator builds do not need signing, so this stays invisible until an archive
fails with:

```
error: Signing for "WanderNote" requires a development team.
```

After any prebuild, either re-add the team to the project:

```
DEVELOPMENT_TEAM = V5746UM5UL;
```

next to each `PRODUCT_BUNDLE_IDENTIFIER` line in
`ios/WanderNote.xcodeproj/project.pbxproj`, or pass it per-build (below).

## Archiving

```bash
cd ios && xcodebuild \
  -workspace WanderNote.xcworkspace \
  -scheme WanderNote \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ~/Desktop/WanderNote-<version>.xcarchive \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=V5746UM5UL \
  archive
```

Passing `DEVELOPMENT_TEAM` on the command line survives prebuild, so prefer it
over editing the project when scripting.

## EAS alternative

`eas.json` has a `production` profile. EAS handles certificates and profiles in
the cloud, so it is immune to the prebuild trap entirely:

```bash
npx eas build --platform ios --profile production
```

EAS project id is in `app.json` under `extra.eas.projectId`.

## The prebuilt React Native trap (Debug vs Release)

RN 0.81 ships a prebuilt `React.xcframework`. A Pods build phase swaps the
Debug/Release variant, deciding from a marker file:

```js
// node_modules/react-native/scripts/replace-rncore-version.js
if (!fileExists && configuration === 'Debug') {
  return false;  // assumes: no marker means the on-disk copy is already Debug
}
```

That assumption breaks in this sequence:

1. `pod install` → installs the Debug variant, no marker
2. Release archive → swaps in Release, writes marker `Release`
3. `pod install` again (adding a dependency) → **wipes the marker, leaves the
   Release framework in place**
4. Debug build → sees "no marker + want Debug", decides no swap is needed, and
   links against Release

The failure looks nothing like its cause. `expo run:ios` prints:

```
⚠️ cannot link directly with 'SwiftUICore'
❌ ld: symbol(s) not found for architecture arm64
```

The SwiftUICore line is only a warning. Run `xcodebuild` directly to see the
real error: missing `facebook::react::Sealable` and
`ShadowNode::getDebugName()`. Those are debug-only symbols, which is why the
Release archive succeeded while the Debug build failed.

Confirm with `nm`:

```bash
nm -arch arm64 ios/Pods/React-Core-prebuilt/React.xcframework/ios-arm64_x86_64-simulator/React.framework/React | grep -c getDebugName
```

0 means the Release variant is in place; a Debug build needs a non-zero count.

Fix — force the swap using RN's own script, run from inside `ios/Pods`
(`LAST_BUILD_FILENAME` is resolved against the working directory, not `-p`):

```bash
cd ios/Pods
printf 'Release' > React-Core-prebuilt/.last_build_configuration
node ../../node_modules/react-native/scripts/replace-rncore-version.js -c Debug -r 0.81.5 -p .
```

Cleaning DerivedData does **not** help — the wrong binary lives in `Pods/`.

After any `pod install`, write the marker back so the next configuration
switch is detected:

```bash
printf 'Debug' > ios/Pods/React-Core-prebuilt/.last_build_configuration
```

## Metro serves a stale bundle after edits

`expo run:ios` is launched with `CI=1` in these notes, which disables Metro's
file watching. Edit a JS file after that build and the running app keeps the
old bundle — the UI shows old strings while the source is correct, which reads
exactly like a code bug.

Two further traps when checking this:

- `xcrun simctl launch` starts the dev client against its cached bundle.
  Reload through the dev-client URL instead:
  `xcrun simctl openurl <udid> "com.litao0729.wandernote://expo-development-client/?url=http%3A%2F%2F<ip>%3A8081"`
- Several Metro instances can pile up across builds. Check with
  `lsof -ti:8081` and kill them before starting a fresh one with
  `npx expo start --clear`.

## Verifying i18n completeness

Do not check translation coverage with a line-anchored regex. Several language
files put multiple keys on one line, so `^\s*(key):` silently misses them and
reports keys as absent that are present. Evaluate the module instead:

```js
const src = fs.readFileSync('i18n/ja.js', 'utf8');
const m = { exports: {} };
new Function('module', 'exports', src.replace(/export default/, 'module.exports ='))(m, m.exports);
```

This produced two false alarms in one session before being caught by looking
at the running app.

## After merging the Watch app: `ios/` is tracked, prebuild is off-limits

The Watch companion target is hand-written Swift living inside
`WanderNote.xcodeproj`. `expo prebuild` cannot generate it, so from the merge
of `feature/watch-companion-v1-integration` onward `ios/` is under version
control and **`npx expo prebuild` must not be run on this branch** — it
rewrites the Xcode project and drops the Watch target.

The consequence that bites immediately: **`app.json` is no longer the source
of truth for permissions or plugin-injected Info.plist keys.** Editing
`app.json` changes nothing on its own now.

Change permission strings in `ios/WanderNote/Info.plist` directly, and keep
`app.json` in sync so the two do not drift and mislead the next person.

The shipped app declares exactly three, each tied to a user-initiated action:

```
NSCameraUsageDescription
NSLocationWhenInUseUsageDescription
NSPhotoLibraryUsageDescription
```

The merge itself demonstrated the hazard. The Watch branch's June Info.plist
overwrote the working tree and restored three declarations that had been
removed for the 5.1.1 privacy rejection:

```
NSFaceIDUsageDescription           (expo-secure-store — dependency deleted)
NSMicrophoneUsageDescription       (expo-image-picker default — no video capture)
NSPhotoLibraryAddUsageDescription  (photo filters — screen deleted)
```

They were removed again by hand. **Check this list after any merge that
touches `ios/`:**

```bash
plutil -p ios/WanderNote/Info.plist | grep -i usagedescription
```

More than those three means something regressed.

### Version numbers also stopped following app.json

Same cause: with `ios/` tracked, `app.json`'s `version` and `ios.buildNumber`
no longer reach the project. The merge left the Xcode project on 1.0.2 / 10
while `app.json` said 1.0.4 / 12.

Bump both places, and note the Watch target carries its own copy — App Store
Connect rejects a submission whose Watch app version does not match the host
app:

```bash
grep -oE "(MARKETING_VERSION|CURRENT_PROJECT_VERSION) = [^;]*" \
  ios/WanderNote.xcodeproj/project.pbxproj | sort -u
```

Both keys should print exactly one value each, matching `app.json`.

## The watch complication target (added in 1.0.4)

`TravelWatchComplication` is a WidgetKit app-extension target nested inside the
Watch App, which is itself nested inside the iOS app. It was added by editing
`project.pbxproj` directly (see the script kept alongside this change), because
`expo prebuild` cannot generate any of it — the same reason `ios/` is tracked.

Three things cost real time here; all three produce a **green build** while
leaving the complication broken, so check the built product, not the exit code.

### `INFOPLIST_KEY_NSExtensionPointIdentifier` does not exist

There is no such build setting. Xcode silently ignores unknown `INFOPLIST_KEY_*`
entries, so the extension compiles, links, and embeds correctly — with **no
`NSExtension` dictionary in its Info.plist**, which means watchOS never offers it
in the watch-face gallery.

An explicit `INFOPLIST_FILE` is required. Verify after building:

```bash
plutil -p "$DERIVED/TravelWatchCompanion Watch App.app/PlugIns/TravelWatchComplication.appex/Info.plist" | grep -A2 NSExtension
```

### The Info.plist must live outside the synchronized folder

The target uses a `PBXFileSystemSynchronizedRootGroup`, so everything inside
`ios/TravelWatchComplication/` is picked up automatically. An `Info.plist` in
there is treated both as the target's Info.plist *and* as a resource to copy,
which fails with `Multiple commands produce .../Info.plist`. It lives at
`ios/TravelWatchComplication-Info.plist` instead. The `.entitlements` file inside
the folder is fine — Xcode excludes that type.

### Simulator entitlements land in a different file

`TravelWatchComplication.appex.xcent` is empty for simulator builds and
`codesign -d --entitlements` reports `[Dict]`. That is not a missing App Group —
check `*-Simulated.xcent` instead:

```bash
plutil -p "$INTERMEDIATES/TravelWatchComplication.build/TravelWatchComplication.appex-Simulated.xcent"
```

## App Group

`group.com.litao0729.wandernote` is shared by the Watch App and the complication.
The extension is a separate process and cannot run CoreLocation or HealthKit, so
the Watch App flattens everything into `GlanceWidgetPayload` and writes it there;
the complication only reads.

`ParkingStore` moved from `UserDefaults.standard` into this group and carries a
one-shot migration, because a parking point saved by an earlier build would
otherwise disappear on upgrade.

Distribution builds need the App Group registered on the developer portal.
Automatic signing normally creates it; if an archive fails on a missing
`com.apple.security.application-groups` entitlement, that registration is the
thing to check first.
