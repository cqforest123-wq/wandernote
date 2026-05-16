// WanderNote feature flags.
//
// Global main:
// - Keep purchases disabled for the first global beta.
// - Do not mix RevenueCat / App Store IAP issues into core product QA.
//
// Domestic CN branch:
// - Keep domestic ad experiments isolated on domestic-cn-ads-mvp.
// - Start with mock rewarded ads only.
// - Do not integrate real ad SDKs until the product flow is validated.

export const ENABLE_PURCHASES = false;

// Temporary beta unlock for global core testing.
// Before monetization or production release:
// - set BETA_UNLOCK_PRO = false
// - set ENABLE_PURCHASES = true
// - configure RevenueCat + App Store subscriptions.
export const BETA_UNLOCK_PRO = true;

// Domestic CN Ads MVP flags.
// These should remain false on the global main branch.
export const ENABLE_DOMESTIC_CN_MODE = true;
export const ENABLE_REWARDED_ADS = true;
export const USE_MOCK_REWARDED_ADS = true;

// Initial quota model for domestic MVP.
// Do not allow unlimited ad-to-AI usage, because AI calls have real cost.
export const CN_DAILY_FREE_AI_ITINERARY_LIMIT = 1;
export const CN_DAILY_REWARDED_AI_LIMIT = 3;
export const CN_DAILY_FREE_TRIP_CAPSULE_LIMIT = 0;
