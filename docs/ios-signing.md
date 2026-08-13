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
