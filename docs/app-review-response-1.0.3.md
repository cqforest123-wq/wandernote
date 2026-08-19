# App Review response — WanderNote 1.0.3 (build 11)

Reply to the 1.0.1 (9) rejection.
Submission ID: b4de2829-d20b-4482-8a4f-b8b93f8e56d0

Two guidelines were cited, in two separate messages:

- **2.1(a) Performance — App Completeness** (2026-06-23): "we were unable to
  generate Travel story", reviewed on iPad Air 11-inch (M3), iPadOS 26.5.
- **5.1.1(v) Legal — Privacy — Data Collection and Storage** (follow-up):
  "the app requires users to register before accessing the app. Registration
  can only be required for account-based features like saving the progress."

---

## Reply text

Hello,

Thank you for the detailed review of WanderNote 1.0.1, and for the follow-up
clarifying the account requirement. We have addressed both issues in build 11.

### Guideline 5.1.1(v) — registration is no longer required

You are right, and the previous build was clearly wrong on this point. The
entire app sat behind mandatory email registration, even though WanderNote is
a travel journal that stores everything on the device.

In build 11 no registration is required at any point. The first screen now
offers "Continue without an account", and every feature works from there:

- creating and editing trips, days, notes and photos
- packing lists and templates
- the travel footprint map
- destination weather
- AI travel writing (diary, social post, trip summary, itinerary)

All of that data is stored on the device. The only thing an account enables is
optional sync of trips and lists between a user's own devices — an
account-based feature in the sense the guideline describes. Users who do
create an account can still delete it, along with their synced data, from
Profile → Delete Account.

### Guideline 2.1(a) — "we were unable to generate Travel story"

There were two independent causes, and we could reproduce the second one.

**1. The backend was unreachable during review.**

AI generation was routed through an edge function on a free-tier Supabase
project. Free-tier projects are automatically paused after a period of
inactivity, and that project was paused. Sign-in, sync and AI generation all
ran through it, so nothing was left working.

AI generation now runs on Cloudflare Workers, which has no idle suspension, so
it no longer depends on a service that can pause between releases. We verified
the new endpoint end to end, including the itinerary mode that returns
structured JSON.

**2. The app reported a false failure to new users.**

On a fresh install there are no saved trips yet, and the Travel story screen
took a code path that displayed: "Generated a local travel story because the
online AI service was unavailable." That message appeared even when nothing was
wrong — it was the empty-state path reusing the service-failure text. We
believe this is what you saw.

The two cases are now separate. An empty library explains how to add content,
and the AI tab opens in itinerary mode when there are no trips, so generation
succeeds on a fresh install with only a destination typed in. A genuine service
failure is reported distinctly and still falls back to on-device generation
rather than failing outright.

We also removed a Photo Filters screen that did not work correctly: it saved
the unedited original image rather than the filtered one.

### Additional changes we made

These were not raised in review; we found them while fixing the above.

- Our privacy policy named the wrong AI provider. It has been corrected, is now
  available in English as well as Chinese, and lists every third-party service
  the app actually contacts:
  https://cqforest123-wq.github.io/wandernote/privacy-policy.html
- We removed permission declarations the app never used — background location,
  microphone, and Face ID — which had been added by default by our dependencies.
  The app now declares only camera, photo library, and when-in-use location.

### Review notes

No account is needed to review the app: tap "Continue without an account" on
the first screen. If you would like to test the account features, registration
requires no email confirmation, and Delete Account is under the Profile tab.

Thank you again for the thorough review.

---

## Verification performed before resubmitting

| Area | Result |
|---|---|
| Fresh install → skip sign-in → generate, iPhone 17 Pro | real AI output |
| Same path on iPad Air (M4), the review device class | real AI output |
| AI proxy: auth, empty prompt, malformed body | 401 / 400 / 400 as designed |
| AI proxy: English and Chinese generation | 200, real Gemini output |
| Itinerary JSON parsed by the app's own parser | valid, all fields present |
| Backend returning 401 | localized fallback, no crash or hang |
| Account deletion end to end | data removed, account gone, email reusable |
| Sign-up | no email confirmation required |
| Permissions in the shipped Info.plist | camera, photo library, when-in-use location |
