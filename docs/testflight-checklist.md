# WanderNote 1.1.2 Release Verification Checklist

Use this for the exact candidate build before App Store submission. A checked item requires
observed evidence; source compilation alone is not a pass.

## iPhone App

- [ ] Fresh install opens without requiring an account or network connection.
- [ ] Create, edit, and delete a trip; force-quit and relaunch; confirm changes persist.
- [ ] Add/edit/delete daily notes, photos, videos, and packing lists; verify local media remains
  available after relaunch.
- [ ] Exercise local diary, summary, social-caption, itinerary, and packing templates; confirm
  the output is presented as a template/draft, not online AI output.
- [ ] Test city search, geocoding, weather, map, and navigation online and graceful errors offline.
- [ ] Confirm local storage warning is understandable and remains discoverable in Profile.
- [ ] Clear local data and confirm the destructive confirmation and resulting empty state.
- [ ] Verify settings, language changes, privacy link, support contact, and current version label.
- [ ] Check portrait layouts and keyboard behavior on supported iPhone sizes.

## Apple Watch Companion

- [ ] Install/launch the companion on a paired physical Watch.
- [ ] Verify travel snapshot, stale cache, and daily fallback.
- [ ] Verify location, altitude, steps, daylight, and parking where permissions/data allow;
  unavailable states must remain clear and non-blocking.
- [ ] Verify parking save and return-to-parking action.
- [ ] Confirm the iPhone and Watch icons display the WanderNote artwork.
- [ ] Capture current Watch screenshots only after these checks pass.

## Store Submission

- [ ] Build and archive from the final reviewed commit using an unused build number.
- [ ] Confirm App Store metadata does not promise accounts, sync, backup, AI, or features absent
  from the submitted binary.
- [ ] Verify published privacy policy and App Store Connect privacy disclosures.
- [ ] Upload current iPhone screenshots and required Watch screenshots; remove personal data.
- [ ] Check support URL, contact details, age rating, localizations, review notes, and build
  selection in App Store Connect.
- [ ] Review the final submission summary before submitting for review.

## Automated Checks

- `npm run test:local`
- `npm run check`
- `npm run check:watch`
- `git diff --check`
- iPhone simulator scheme and standalone Watch target compile
