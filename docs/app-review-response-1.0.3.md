# App Review response — WanderNote 1.0.3 (build 11)

Draft reply for the 1.0.1 (9) rejection of 2026-06-23.
Submission ID: b4de2829-d20b-4482-8a4f-b8b93f8e56d0

> **TODO before sending:** the App Store Connect thread has three messages and
> only the 2.1(a) one has been read so far. Check the other two for the exact
> wording of the 5.1.1 citation and adjust section 2 to match what they
> actually asked for.

---

## Reply text

Hello,

Thank you for the detailed review of WanderNote 1.0.1. We found the root
causes for both issues and have addressed them in build 11. Details below.

### Guideline 2.1(a) — "we were unable to generate Travel story"

You were right, and there were two independent causes.

**1. The backend was unreachable during review.**

AI generation was routed through an edge function hosted on a free-tier
Supabase project. Free-tier projects are automatically paused after a period
of inactivity, and that project was paused. Because sign-in, data sync and AI
generation all ran through the same project, the app had no working path left.

We have moved AI generation to Cloudflare Workers, which has no idle
suspension. AI generation no longer depends on the service that can pause.
We have verified the new endpoint end to end, including the itinerary mode
that returns structured JSON.

**2. The app reported a false failure to new users.**

On a fresh install there are no saved trips yet, so the "Travel story" screen
took a code path that displayed: "Generated a local travel story because the
online AI service was unavailable." That message appeared even when nothing
was wrong — it was the empty-state path, not a real service error. We believe
this is what you saw.

We have separated the two cases. An empty library now explains how to add
content, and the AI tab defaults to itinerary mode when there are no trips, so
generation works immediately on a fresh install with only a destination typed
in. A genuine service failure is reported separately and still falls back to
on-device generation rather than failing outright.

We also removed a Photo Filters screen that did not work correctly: it saved
the unedited original image rather than the filtered one.

### Guideline 5.1.1 — Legal: Privacy - Data Collection and Storage

**1. An account is no longer required.**

WanderNote is a local travel journal and has no account-based features. The
previous build put the entire app behind mandatory email registration. The app
can now be used fully without an account — the first screen offers "Continue
without an account", and all trips, notes, photos and packing lists stay on
the device. Signing in is optional and only enables sync between a user's own
devices.

**2. Our privacy policy misidentified a data processor.**

The policy stated that AI content was sent to the Anthropic Claude API. The
app has in fact always sent it to Google Gemini. This was our error and we
have corrected it.

The policy has been rewritten and now: names the real processors (Google
Gemini, Supabase, Open-Meteo, OpenStreetMap Nominatim, Apple Maps); is
available in both English and Chinese, where it was previously Chinese only;
states accurately that photos never leave the device and that location is used
on-device only and never transmitted; and no longer claims a data-export
feature the app does not provide.

https://cqforest123-wq.github.io/wandernote/privacy-policy.html

**3. Reduced data collection.**

Removing the Photo Filters screen let us drop the
NSPhotoLibraryAddUsageDescription permission entirely. The app now requests
only camera, photo library read, and when-in-use location — each tied to a
feature the user actively invokes.

### Review notes

No account is needed to review the app — tap "Continue without an account" on
the first screen. If you would like to test account features, registration
requires no email confirmation, and Delete Account is under the Profile tab.
We have verified that account deletion removes both the account and all synced
data.

Thank you again for the thorough review.

---

## Verification performed before resubmitting

| Area | Result |
|---|---|
| AI proxy: auth, empty prompt, malformed body | 401 / 400 / 400 as designed |
| AI proxy: English + Chinese generation | 200, real Gemini output |
| AI proxy: itinerary JSON parsed by app parser | valid, 3 days, all fields |
| Account deletion end to end | data removed, account gone, email reusable |
| Sign-up | no email confirmation required |
| Permissions in built Info.plist | camera, photo read, location only |
