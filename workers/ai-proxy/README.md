# WanderNote AI proxy (Cloudflare Worker)

Replaces the Supabase edge function `claude-proxy`.

## Why this moved off Supabase

Supabase free-tier projects pause after about 7 days of inactivity. When the
project paused, login, sync **and** AI generation all stopped at once — the app
had no working path left. App Review hit exactly this in June 2026 and rejected
the build under Guideline 2.1(a) ("we were unable to generate Travel story").

Cloudflare Workers have no idle pause, and moving the AI call here means a
Supabase outage can no longer take down AI generation. After this change
Supabase is only used for optional account sync.

## Deploy

You need a Cloudflare account (free plan is enough) and the Gemini API key that
is currently set as the `GEMINI_API_KEY` secret on the Supabase project.

```bash
cd workers/ai-proxy
npx wrangler login          # opens a browser
npx wrangler deploy
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put APP_TOKEN
```

`wrangler deploy` prints the worker URL, e.g.
`https://wandernote-ai-proxy.<your-subdomain>.workers.dev`.

Put that URL and the same `APP_TOKEN` value into `lib/aiConfig.js`.

## Verify

```bash
curl -sS -X POST "https://wandernote-ai-proxy.<your-subdomain>.workers.dev" \
  -H "Content-Type: application/json" \
  -H "x-app-token: <your APP_TOKEN>" \
  -d '{"prompt":"Write one sentence about Kyoto in spring.","maxTokens":200}'
```

Expected: `{"content":[{"type":"text","text":"..."}]}`

## Notes

- `APP_TOKEN` ships inside the app binary, so it is a speed bump against casual
  scraping, not real authentication. If abuse shows up, add Cloudflare Rate
  Limiting rules on the worker route — that is a dashboard change, no code.
- The worker distinguishes upstream failure modes (`MAX_TOKENS`, `SAFETY`,
  blocked prompt, timeout, 429) instead of collapsing them into one generic
  "Empty AI response" the way the Supabase version did.
- The app still falls back to on-device generation (`lib/travelStoryFallback.js`)
  if this worker is unreachable, so AI features never hard-fail.
