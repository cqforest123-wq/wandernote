# WanderNote 1.2 Roadmap

Decided 2026-09-14, after 1.1.0 had been live for three weeks.

## Who it is for

Travellers in Europe and North America. Mainland China is not a target for this
line: the AI proxy on `*.workers.dev` is unreachable there, and that is accepted
rather than worked around. The domestic plan on the `domestic-cn-*` branches
(旅迹) remains a separate product and stays off `main`.

## What 1.1.0 taught us

- About five first downloads in the first month, no ratings, no reviews.
- Account sync had never been used: every synced table was empty, and the five
  accounts in Supabase all predate the App Store release.
- The free Supabase project paused unnoticed after release, which took sign-in,
  sync and account deletion down while guest mode and AI hid the outage.
- All 27 EU countries were unavailable because the DSA trader status had not
  been declared. Declared 2026-09-14; under review.
- The English store listing carried a Chinese subtitle.

## Decisions

### Local-only. No accounts, no Supabase.

1.2 removes sign-in, sync and the account screens. Every trip, photo, note and
list lives on the device; export and backup remain the way to move data.

Why: nobody used sync, and keeping it means holding European users' personal
data in a US region, carrying GDPR obligations for it, and depending on a
backend that pauses itself. Accounts come back only if there is demand, and
then as a deliberate feature rather than a leftover.

Local data is unaffected: trips and lists were always stored under the same
keys whether or not someone was signed in; sync only copied them.

Transition, in this order:

1. Ship 1.2 without accounts.
2. Keep the Supabase project and the ai-proxy keep-alive cron running while
   1.1.0 is still installed — it still offers sign-up, so App Review requires
   its in-app account deletion to keep working.
3. After 1.2 has been live long enough for users to update, remove the cron,
   the `supabase/` functions, and pause or delete the project.

### Keep social captions in the AI screen

The May split moved *domestic* publishing (WeChat Moments, Xiaohongshu,
Douyin) into a separate app. The global plan always included Instagram, TikTok
and WhatsApp style output, which is what these users share to.

### AI keeps its local fallback

Unchanged rule: every AI entry point must produce a usable local result when
the proxy fails. No blank screen, no bare error, no endless spinner.

## 1.2 scope

1. Remove Supabase and accounts (this decision). Done.
2. Show dates and times in the reader's locale. Storage keeps `YYYY.MM.DD`,
   which backups and day matching depend on; only display changes. Done:
   app language plus device region, so English on a German iPhone reads
   "20. Oct 2026". Weekdays are worked out from the date rather than the text
   stored at creation. The forecast strip names weekdays instead of "09/15",
   and its temperatures follow the unit preference — they were Celsius for
   everyone, with a bare "32°" in the new-trip sheet.
3. Add German, the largest App Store market in Europe. App, watch and store
   page together. App and watch done: every app string, the permission
   prompts on iPhone and watch, and the watch glance. The destination search
   hints no longer fall back to English outside Chinese, and the date pickers
   were fixed to `zh-CN` for everyone and now follow the reader's locale.
   Still zh/en only: weather descriptions and clothing advice in
   `lib/weather.js`, and the packing templates. Store page pending.
4. Privacy policy: drop accounts and sync; state that AI sends the user's own
   note text to Google Gemini via our Cloudflare Worker.
5. Remove the Watch rule that prefers snapshot parking — the iPhone never sends
   parking, so it can never fire. Done: parking comes from the watch only;
   the snapshot field stays for wire compatibility.
6. Home currency follows the device region. It was CNY for everyone. Done,
   with SEK, NOK, DKK, PLN, CZK and HUF added so those regions no longer fall
   back to USD. The three crowns show their codes rather than a shared "kr".

## Store work that needs no build

- Fix the English subtitle and put a keyword in the name.
- Add French and Spanish store pages; the app already speaks both.
- Replace placeholder screenshots with real travel photos.
- Confirm the 27 EU countries become available once the DSA review clears.

## Not now

- A standalone LifeGlance watch app — no usage data to justify it.
- WeatherKit, subscriptions, paywalls.
- Mainland China AI access.

## Record of plan drift

The watch plan said no complication in the first phase. A watch-face
complication shipped in 1.1.0 and works; the plan is updated here rather than
the feature removed.
