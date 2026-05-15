import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - 上架前替换为真实 key
const REVENUECAT_API_KEY_IOS = '';
const REVENUECAT_API_KEY_ANDROID = '';

// 产品ID - 在 App Store Connect / RevenueCat 配置后替换
export const PRODUCT_IDS = {
  monthly: '',
  yearly: '',
};

let purchasesReady = false;

function getRevenueCatApiKey() {
  return Platform.OS === 'ios'
    ? REVENUECAT_API_KEY_IOS
    : REVENUECAT_API_KEY_ANDROID;
}

function hasValidRevenueCatKey() {
  const apiKey = getRevenueCatApiKey();
  return Boolean(apiKey) && apiKey.length > 10;
}

// 初始化 RevenueCat
export async function initPurchases(userId) {
  if (!hasValidRevenueCatKey()) {
    purchasesReady = false;
    console.warn('RevenueCat 未配置真实 API Key，1.0 内测阶段跳过初始化');
    return false;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    await Purchases.configure({
      apiKey: getRevenueCatApiKey(),
      appUserID: userId || null,
    });

    purchasesReady = true;
    console.log('RevenueCat initialized');
    return true;
  } catch (e) {
    purchasesReady = false;
    console.warn('initPurchases error:', e.message);
    return false;
  }
}

// 检查用户是否是 Pro 会员
export async function checkProStatus() {
  if (!purchasesReady) return false;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.pro !== undefined;
  } catch (e) {
    console.warn('checkProStatus error:', e.message);
    return false;
  }
}

// 获取产品列表
export async function getOfferings() {
  if (!purchasesReady) {
    console.warn('RevenueCat 未就绪，无法加载 offerings');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current || null;
  } catch (e) {
    console.warn('getOfferings error:', e.message);
    return null;
  }
}

// 购买产品
export async function purchasePackage(pkg) {
  if (!purchasesReady) {
    return { success: false, error: '订阅功能暂未开放' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return {
      success: true,
      isPro: customerInfo.entitlements.active.pro !== undefined,
    };
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: e.message };
  }
}

// 恢复购买
export async function restorePurchases() {
  if (!purchasesReady) {
    return { success: false, error: '订阅功能暂未开放' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      success: true,
      isPro: customerInfo.entitlements.active.pro !== undefined,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
