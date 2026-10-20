# Local First Release

Status: implementation and development verification only. Not uploaded or submitted.
Repository: `/Users/litao/Developer/wandernote-watch`
Branch: `feature/watch-companion-v1-integration`

## Agreed Scope

- Free, no account or login, no plan-based trip or checklist count limit.
- Trips, daily notes, checklists, profile preferences and selected media stay in local app storage.
- No in-app backup, archive export, import or restore in this release.
- No ads, ad SDKs, subscriptions, purchases or paywalls.
- Existing local draft, planning and packing templates remain. Online AI is not called and the interface no longer promises AI output.
- Weather, city search, geocoding and maps still use their existing network providers. Local-only records do not mean all network features work offline.
- Watch Companion supports travel snapshots and daily outdoor information only. WatchConnectivity remains device-to-device, not backend sync.
- Backup and a possible advertising-supported edition are deferred, not implemented or promised.

## Data Preservation

The existing `@wandernote_trips` and `@wandernote_memos` keys are reused. Removing the login gate does not clear data or sign out/delete historical accounts. Former Supabase/auth/sync/Claude files remain in the repository but are unreachable from the application import graph.

Historical cloud records are NOT automatically downloaded, migrated or deleted. A user with cloud-only history would need a separately reviewed migration process before switching. Do not delete the old backend or remote records as part of this release.

Collection writes are serialized. Read errors show a retry screen instead of replacing stored records with an empty list. Failed saves display a warning and retry action; changes are not guaranteed durable until a save succeeds.

New selected photos and videos are copied from picker cache into the app's Documents directory. Existing readable local media is preserved there on startup; old iOS sandbox paths are rebased when possible. Missing files cannot be recovered, and legacy remote references are retained rather than silently dropped. This is local persistence, not backup. OS-level device backup is outside the app's control and is not a promised recovery mechanism.

`expo-file-system` 19.0.22 was already bundled through Expo and included in Pods. It is now an explicit dependency at the same version; no new third-party SDK was introduced. `pod install --no-repo-update` updated only its local source path in `Podfile.lock`.

## User Notice

First entry after onboarding displays a one-time notice, also permanently visible in Profile:

> Travel records are stored on this device. This version has no cloud sync, backup, or import. Deleting the app or changing phones may make records unrecoverable.

The seven supported locales include the notice, storage error states, local template labels and corrected onboarding copy. Unused historical auth/paywall translations remain; no reachable UI references the paywall keys.

Existing draft bodies use the pre-existing English local templates. Do not advertise multilingual AI composition or destination-specific itinerary recommendations.

## Verification, 2026-10-14

- `npm run test:local`: 13 tests passed. Includes legacy data, empty offline install, 100 trips/lists, ordered writes, disk-full retry, corrupt data, linked packing deletion, media copying/rebasing, local draft modes, runtime import audit and localization keys.
- `npm run check`: passed.
- `npm run check:watch`: snapshot, glance, parking and sun tests passed; audit reports zero blockers and the existing hidden yearly report warning.
- `npx expo export --platform ios --output-dir /tmp/wandernote-local-export`: passed.
- Debug iPhone simulator scheme, physical iPhone destination scheme and standalone Watch simulator target: compiled successfully.
- iPhone 17 Pro simulator, iOS 26.5: replacing the development app without deleting its data opens the local home screen, not login. Existing 3 trips / 7 photos remain. Local-data warning is visible. Evidence: `/tmp/wandernote-local-qa/first-launch-ready.png`.
- Initial workspace build with a globally forced `-sdk iphonesimulator` failed because it forced the Watch dependency to the iPhone SDK. Selecting the iPhone simulator destination without the global SDK override builds both targets successfully. No source change was needed.
- Physical-device verification of this local edition and Watch sensor data are NOT claimed by these compile/unit/startup checks.

## Before Any Store Submission

- Review and approve this local-only product scope and confirm how any historical cloud-only users will be handled.
- Install the local edition on the real iPhone without uninstalling the previous app; verify existing records/media, create/edit/delete in airplane mode, cold start, packing templates and Watch pairing. Check low-storage save errors where possible.
- Manually check onboarding, all tabs, storage notice and draft result visibility on supported device sizes. No login, online-AI, cloud-backup, paid-plan or ad promises in screenshots or metadata.
- Publish the updated `privacy-policy.html` to the actual hosted policy URL and verify it. Pushing this feature branch does not publish the GitHub Pages policy automatically.
- Review App Store privacy declarations for this edition and its remaining network/Health/location services. Do not automatically claim no data collection without reviewing provider behavior.
- Current App Store release materials target Expo/Xcode `1.1.2 (12)` across the iPhone and Watch targets. See `app-store-1.1.2-release-pack.md`; a fresh archive is still required after the latest source changes.
- No version, build number, bundle ID or signing team was changed here. No EAS, TestFlight, App Store archive, upload or submission was performed.

## Review Notes Draft

WanderNote is a free, account-free app in this edition. Travel records and selected media are stored locally. There are no subscriptions, In-App Purchases, external purchase mechanisms or advertisements. There is no in-app backup or import, and users are informed that deleting the app or replacing the device may make records unrecoverable. Travel drafts and packing lists use local templates, not an online AI service. Weather, city search and maps require their existing external services. Optional Apple Watch functions require a paired Watch and the relevant permissions.
