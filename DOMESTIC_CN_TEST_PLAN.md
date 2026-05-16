# WanderNote Domestic CN Ads MVP Test Plan

## Branch

domestic-cn-ads-mvp

## Current Domestic Working Name

旅迹

## Test Scope

This test plan only covers domestic CN ads MVP behavior.

It does not test:
- Global App Store version
- TestFlight production release
- Real ad SDKs
- RevenueCat
- iPad support
- WeChat SDK
- Domestic app store release

## Key Rule

No real ad SDK is integrated in v0.1.

Rewarded ads are mocked by:

lib/ads.js

The business flow uses:

requestDomesticAiItineraryAccess()

## Core Test: AI Itinerary Rewarded Access

### Preconditions

- App is running from domestic-cn-ads-mvp branch.
- ENABLE_DOMESTIC_CN_MODE = true
- ENABLE_REWARDED_ADS = true
- USE_MOCK_REWARDED_ADS = true
- CN_DAILY_FREE_AI_ITINERARY_LIMIT = 1
- CN_DAILY_REWARDED_AI_LIMIT = 3

### Test Steps

1. Open AI screen.
2. Select AI itinerary mode.
3. Enter destination, for example:
   重庆 3 天
4. Generate AI itinerary.

### Expected Result: First Generation

- AI itinerary should generate directly.
- No mock ad alert should appear.
- This consumes the daily free AI itinerary quota.

### Expected Result: Second to Fourth Generation

Repeat AI itinerary generation 3 more times.

Expected:
- Mock rewarded ad unlock alert appears:
  已通过激励广告解锁
- AI itinerary continues after the mock ad.
- Each successful unlock consumes one rewarded AI quota.

### Expected Result: Fifth Generation

Generate AI itinerary again.

Expected:
- Generation is blocked.
- Alert appears:
  今日次数已用完
- AI API should not be called.

## Non-Itinerary AI Modes

Test modes:
- Travel diary
- Social copy
- Trip summary

Expected:
- Existing trip/day validation still works.
- These modes should not use the domestic itinerary quota yet.
- No rewarded ad alert should appear for these modes in v0.1.

## Quota Reset

Quota is stored in AsyncStorage:

@wn_cn_ai_quota_v1

Expected:
- Quota resets automatically by date.
- Deleting the app resets local quota.
- This is acceptable for v0.1.
- Server-side quota is required before public domestic release.

## Risk Notes

Current v0.1 limitation:

Quota is consumed before the AI call finishes.

If AI generation fails due to network or provider error, quota may still be consumed.

This is acceptable for mock MVP validation, but must be improved before real monetization.

Future improvement:
- Consume quota only after successful generation.
- Or refund quota on AI failure.
- Server-side quota required for real public release.

## Pass Criteria

Domestic ads MVP v0.1 passes if:

- First AI itinerary generation is free.
- Second to fourth generations show mock rewarded ad unlock.
- Fifth generation is blocked.
- No real ad SDK is required.
- Global main branch is unaffected.
- App does not crash.
- Existing AI result Copy still works.
