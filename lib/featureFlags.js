// WanderNote v1 feature flags.
// Keep purchases disabled for the first global beta so core flows can be tested
// without mixing RevenueCat / App Store IAP configuration issues into product QA.

export const ENABLE_PURCHASES = false;

// Temporary beta unlock for global core testing.
// Before monetization or production release:
// - set BETA_UNLOCK_PRO = false
// - set ENABLE_PURCHASES = true
// - configure RevenueCat + App Store subscriptions.
export const BETA_UNLOCK_PRO = true;
