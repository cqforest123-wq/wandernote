// Domestic CN Ads MVP
// Phase 0: mock rewarded ads only.
// Do not integrate real ad SDKs here.
// Business code should only depend on showRewardedAd(), not on a specific ad network.

export const AD_REASONS = {
  AI_ITINERARY: 'ai_itinerary',
  TRIP_CAPSULE: 'trip_capsule',
  SOCIAL_OUTPUT: 'social_output',
  TRIP_CARD_EXPORT: 'trip_card_export',
  PACKING_TEMPLATE: 'packing_template',
};

export async function showRewardedAd(reason) {
  // Mock implementation for domestic-cn-ads-mvp.
  // Later this can be replaced by Pangle / GroMore / Tencent GDT rewarded ads.
  console.log('[MockRewardedAd] show rewarded ad for:', reason);

  return {
    rewarded: true,
    source: 'mock',
    reason,
    watchedAt: new Date().toISOString(),
  };
}

export function isRewarded(result) {
  return Boolean(result?.rewarded);
}
