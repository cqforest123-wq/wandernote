// WanderNote v1 feature flags.
// Keep purchases disabled for the first global beta so core flows can be tested
// without mixing RevenueCat / App Store IAP configuration issues into product QA.

export const ENABLE_PURCHASES = false;

// Free strategy for the current global beta / first release:
// - keep BETA_UNLOCK_PRO = false so the 3-trip free limit is enforced.
// - keep ENABLE_PURCHASES = false until App Store IAP / RevenueCat is fully configured.
// - AI generation is allowed for free users during the initial release.
// - future monetization can use ads, daily AI limits, or ad-unlocked AI generation.
export const BETA_UNLOCK_PRO = false;
