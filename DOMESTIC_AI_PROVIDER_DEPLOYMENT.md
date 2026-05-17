# WanderNote Domestic AI Provider Deployment Guide

## Branch

domestic-cn-ads-mvp

## Current Checkpoint

domestic-cn-ai-router-v0.2-ready-for-manual-test

## Purpose

This document defines how to manually test the domestic AI provider router.

Do not deploy or change secrets casually.

## Current Safe State

Current code supports:

- Gemini default provider
- region/task request fields
- provider router in claude-proxy
- DeepSeek provider skeleton

Current production/global flow should remain:

App
-> claude-proxy
-> Gemini

## Critical Safety Rules

Do not:
- Put DeepSeek API key in client code
- Commit API keys
- Paste API keys into chat logs
- Deploy from main accidentally
- Change Apple/TestFlight production build
- Connect real ad SDK during AI provider testing
- Enable DeepSeek before Gemini fallback test passes

## Deployment Preconditions

Before deploying:

1. Confirm branch:

git branch --show-current

Expected:

domestic-cn-ads-mvp

2. Confirm clean working tree:

git status --short

Expected:

no output

3. Confirm latest checkpoint exists:

git log --oneline -5

Expected to include:

6e9c76c docs: add domestic AI provider test plan

4. Confirm no API key in files:

grep -R "sk-\|DEEPSEEK_API_KEY=\|GEMINI_API_KEY=" -n . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.expo

Expected:

no real secrets in repo

## Phase 1: Deploy Router With Gemini Fallback Only

Goal:

Deploy the new router but keep Gemini as default provider.

Secrets:

AI_PROVIDER_GLOBAL=gemini
AI_PROVIDER_CN=gemini

or leave both unset, because the router defaults to Gemini.

Command:

supabase functions deploy claude-proxy

Expected:

- Existing AI route still works
- Domestic region:'cn' calls still use Gemini
- No DeepSeek key needed

Test:

- Generate AI itinerary
- Confirm JSON parses
- Confirm Copy still works
- Confirm no client crash

Rollback:

If Gemini fallback breaks, redeploy the previous known stable function from main/TestFlight checkpoint.

## Phase 2: Unsupported Provider Guard Test

Set temporarily:

AI_PROVIDER_CN=unknown_provider

Expected:

- CN itinerary request returns 501
- Error message says unsupported provider
- App shows generation failed
- No crash
- No API key exposure

After test:

Set AI_PROVIDER_CN back to gemini.

## Phase 3: DeepSeek Missing Key Test

Set:

AI_PROVIDER_CN=deepseek

Do not set:

DEEPSEEK_API_KEY

Expected:

- CN itinerary request returns clear error:
  DeepSeek API key is not configured
- App fails gracefully
- No crash

After test:

Set AI_PROVIDER_CN back to gemini unless ready for real DeepSeek test.

## Phase 4: DeepSeek Real Test

Only do this after creating a DeepSeek API key.

Set secrets:

AI_PROVIDER_CN=deepseek
DEEPSEEK_API_KEY=<secret>
DEEPSEEK_MODEL=deepseek-v4-flash

Do not paste the real key into chat or commit it.

Test itinerary prompts:

- 重庆 3 天
- 东京 3 天
- 法罗群岛 7 天

Expected:

- Returns valid JSON
- parseAiJsonObject works
- AI result displays correctly
- Copy works
- Language follows app language
- No excessive latency
- No malformed JSON

## Phase 5: Quota + DeepSeek Combined Test

Domestic mode and mock rewarded ads should already be enabled.

Expected:

1st itinerary:
- free generation

2nd to 4th itinerary:
- mock rewarded ad unlock
- DeepSeek called after unlock

5th itinerary:
- blocked before provider call
- no DeepSeek cost

## Known Limitation

Current quota is consumed before AI generation finishes.

If AI generation fails, quota may still be consumed.

This is acceptable for internal MVP testing only.

Before real monetization:
- consume quota after successful generation, or
- refund quota on failure, and
- move quota to server-side storage

## Rollback Strategy

Fast rollback options:

1. Set AI_PROVIDER_CN=gemini
   This keeps the router deployed but disables DeepSeek.

2. Redeploy previous claude-proxy from known stable commit.

3. Switch app testing back to global TestFlight build if domestic branch becomes unstable.

## Do Not Proceed If

Stop testing if:

- AI output exposes secrets
- JSON parsing repeatedly fails
- DeepSeek latency is unacceptable
- AI cost looks higher than ad value
- Supabase function errors affect global App Store/TestFlight users
- Apple/TestFlight build is accidentally changed

## Next Step After Successful DeepSeek Test

Only after manual tests pass:

- Document cost per itinerary
- Compare Gemini vs DeepSeek output quality
- Decide whether DeepSeek stays as default CN provider
- Then consider adding Qwen as second provider
- Still do not add real ad SDK until AI cost is understood
