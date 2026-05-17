# WanderNote Domestic AI Provider Test Plan

## Branch

domestic-cn-ads-mvp

## Current Checkpoint

domestic-cn-ai-router-v0.2-deepseek-skeleton

## Goal

Validate the domestic AI provider router safely before enabling real domestic AI traffic.

The current proxy supports:
- Gemini as default provider
- Provider router by region
- DeepSeek provider skeleton

Do not deploy or enable DeepSeek until this checklist is ready.

## Important Safety Rules

Do not:
- Put DeepSeek API key in the app
- Commit API keys
- Deploy Supabase Function without explicit approval
- Set AI_PROVIDER_CN=deepseek before Gemini fallback is tested
- Change global TestFlight main flow
- Change production build config
- Combine real ad SDK integration with AI provider changes

## Current Client Flow

App calls:

callClaude(prompt, maxTokens, {
  responseMimeType,
  region,
  task,
})

Domestic itinerary calls should send:

region: 'cn'
task: 'itinerary'

## Current Proxy Flow

Default:

AI_PROVIDER_GLOBAL not set
AI_PROVIDER_CN not set

Expected:
- global requests use Gemini
- cn requests fallback to Gemini
- existing AI itinerary still works

## Test Case 1: Global Gemini Fallback

Configuration:

AI_PROVIDER_GLOBAL unset or gemini
AI_PROVIDER_CN unset

Steps:
1. Deploy proxy only after approval.
2. Open app.
3. Generate global AI itinerary.
4. Generate domestic-marked itinerary request.

Expected:
- Both use Gemini
- JSON itinerary parses correctly
- No client crash
- Existing Copy still works

## Test Case 2: Unsupported Provider Guard

Configuration:

AI_PROVIDER_CN=unknown_provider

Steps:
1. Send domestic itinerary request.
2. Observe response.

Expected:
- Proxy returns 501
- Error includes unsupported provider name
- Client shows generation failed
- No API key exposure

## Test Case 3: DeepSeek Key Missing

Configuration:

AI_PROVIDER_CN=deepseek
DEEPSEEK_API_KEY unset

Steps:
1. Send domestic itinerary request.

Expected:
- Proxy returns clear error:
  DeepSeek API key is not configured
- Client shows graceful failure
- No crash

## Test Case 4: DeepSeek JSON Itinerary

Configuration:

AI_PROVIDER_CN=deepseek
DEEPSEEK_API_KEY set in Supabase secret
DEEPSEEK_MODEL=deepseek-v4-flash

Steps:
1. Generate itinerary:
   重庆 3 天
2. Generate itinerary:
   东京 3 天
3. Generate itinerary:
   法罗群岛 7 天

Expected:
- DeepSeek returns valid JSON
- parseAiJsonObject works
- Result displays title and daily itinerary
- Opening status / distance / duration fields are present or gracefully handled
- Output language follows App language

## Test Case 5: Quota + Provider Combined

Configuration:

Domestic mode enabled.
Mock rewarded ads enabled.
AI_PROVIDER_CN=deepseek.

Steps:
1. Generate itinerary first time.
2. Generate itinerary second to fourth times.
3. Generate itinerary fifth time.

Expected:
- First generation uses free quota.
- Second to fourth show mock rewarded unlock.
- Fifth is blocked before AI provider call.
- No extra DeepSeek cost after daily limit reached.

## Test Case 6: Failure Cost Risk

Current v0.2 limitation:

Quota may be consumed before AI generation succeeds.

Expected:
- Known issue accepted for internal MVP.
- Before real monetization, move quota consumption to after successful generation or implement refund on failure.

## Pass Criteria

Domestic AI provider v0.2 passes if:

- Global Gemini behavior remains stable.
- CN requests can be routed by provider.
- Unsupported provider fails clearly.
- Missing DeepSeek key fails clearly.
- DeepSeek can produce parseable JSON itinerary.
- AI quota blocks excessive requests before provider call.
- No API keys appear in client bundle.
- No real ad SDK is involved.
