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
