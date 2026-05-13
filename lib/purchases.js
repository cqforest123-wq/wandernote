import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - 注册RevenueCat后替换
const REVENUECAT_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_REVENUECAT_ANDROID_KEY';

// 产品ID - 在App Store Connect配置后替换
export const PRODUCT_IDS = {
  monthly: 'wandernote_pro_monthly',   // 月订阅
  yearly: 'wandernote_pro_yearly',     // 年订阅
};

// 初始化RevenueCat
export async function initPurchases(userId) {
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;
    await Purchases.configure({ apiKey, appUserID: userId || null });
    console.log('RevenueCat initialized');
  } catch (e) {
    console.warn('initPurchases error:', e.message);
  }
}

// 检查用户是否是Pro会员
export async function checkProStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e) {
    console.warn('checkProStatus error:', e.message);
    return false;
  }
}

// 获取产品列表
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) return offerings.current;
    return null;
  } catch (e) {
    console.warn('getOfferings error:', e.message);
    return null;
  }
}

// 购买产品
export async function purchasePackage(pkg) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return {
      success: true,
      isPro: customerInfo.entitlements.active['pro'] !== undefined,
    };
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: e.message };
  }
}

// 恢复购买
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      success: true,
      isPro: customerInfo.entitlements.active['pro'] !== undefined,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
