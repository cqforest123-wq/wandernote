import {
  ENABLE_DOMESTIC_CN_MODE,
  ENABLE_REWARDED_ADS,
} from './featureFlags';

import {
  getAiQuotaStatus,
  consumeFreeAiItinerary,
  consumeRewardedAiUnlock,
} from './aiQuota';

import {
  AD_REASONS,
  showRewardedAd,
  isRewarded,
} from './ads';

export async function getDomesticAiAccessStatus() {
  if (!ENABLE_DOMESTIC_CN_MODE) {
    return {
      domestic: false,
      canGenerate: true,
      reason: 'global_mode',
    };
  }

  const quota = await getAiQuotaStatus();

  return {
    domestic: true,
    canGenerate: quota.canUseFreeAi || quota.canUseRewardedAi,
    canUseFreeAi: quota.canUseFreeAi,
    canUseRewardedAi: quota.canUseRewardedAi,
    quota,
  };
}

export async function requestDomesticAiItineraryAccess() {
  if (!ENABLE_DOMESTIC_CN_MODE) {
    return {
      allowed: true,
      source: 'global_mode',
    };
  }

  const free = await consumeFreeAiItinerary();
  if (free.allowed) {
    return {
      allowed: true,
      source: 'free',
      quota: free.quota,
    };
  }

  const status = await getAiQuotaStatus();

  if (!ENABLE_REWARDED_ADS || !status.canUseRewardedAi) {
    return {
      allowed: false,
      reason: status.canUseRewardedAi ? 'rewarded_ads_disabled' : 'daily_limit_reached',
      quota: status,
    };
  }

  const adResult = await showRewardedAd(AD_REASONS.AI_ITINERARY);

  if (!isRewarded(adResult)) {
    return {
      allowed: false,
      reason: 'ad_not_rewarded',
      quota: await getAiQuotaStatus(),
    };
  }

  const rewarded = await consumeRewardedAiUnlock();

  if (!rewarded.allowed) {
    return {
      allowed: false,
      reason: rewarded.reason,
      quota: rewarded.quota,
    };
  }

  return {
    allowed: true,
    source: 'rewarded_ad',
    ad: adResult,
    quota: rewarded.quota,
  };
}
