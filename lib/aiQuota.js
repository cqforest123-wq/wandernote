import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CN_DAILY_FREE_AI_ITINERARY_LIMIT,
  CN_DAILY_REWARDED_AI_LIMIT,
} from './featureFlags';

const STORAGE_KEY = '@wn_cn_ai_quota_v1';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultQuota() {
  return {
    date: todayKey(),
    freeAiItineraryUsed: 0,
    rewardedAiUsed: 0,
  };
}

async function readQuota() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultQuota();

    const parsed = JSON.parse(raw);
    if (parsed?.date !== todayKey()) {
      return defaultQuota();
    }

    return {
      ...defaultQuota(),
      ...parsed,
    };
  } catch (e) {
    return defaultQuota();
  }
}

async function writeQuota(quota) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(quota));
  return quota;
}

export async function getAiQuotaStatus() {
  const quota = await readQuota();

  return {
    ...quota,
    freeRemaining: Math.max(0, CN_DAILY_FREE_AI_ITINERARY_LIMIT - quota.freeAiItineraryUsed),
    rewardedRemaining: Math.max(0, CN_DAILY_REWARDED_AI_LIMIT - quota.rewardedAiUsed),
    canUseFreeAi: quota.freeAiItineraryUsed < CN_DAILY_FREE_AI_ITINERARY_LIMIT,
    canUseRewardedAi: quota.rewardedAiUsed < CN_DAILY_REWARDED_AI_LIMIT,
  };
}

export async function consumeFreeAiItinerary() {
  const quota = await readQuota();

  if (quota.freeAiItineraryUsed >= CN_DAILY_FREE_AI_ITINERARY_LIMIT) {
    return {
      allowed: false,
      reason: 'free_limit_reached',
      quota: await getAiQuotaStatus(),
    };
  }

  quota.freeAiItineraryUsed += 1;
  await writeQuota(quota);

  return {
    allowed: true,
    source: 'free',
    quota: await getAiQuotaStatus(),
  };
}

export async function consumeRewardedAiUnlock() {
  const quota = await readQuota();

  if (quota.rewardedAiUsed >= CN_DAILY_REWARDED_AI_LIMIT) {
    return {
      allowed: false,
      reason: 'rewarded_limit_reached',
      quota: await getAiQuotaStatus(),
    };
  }

  quota.rewardedAiUsed += 1;
  await writeQuota(quota);

  return {
    allowed: true,
    source: 'rewarded_ad',
    quota: await getAiQuotaStatus(),
  };
}

export async function resetAiQuotaForTesting() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return getAiQuotaStatus();
}
