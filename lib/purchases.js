export const PRODUCT_IDS = {
  monthly: '',
  yearly: '',
};

export async function initPurchases() {
  return false;
}

export async function checkProStatus() {
  return false;
}

export async function getOfferings() {
  return null;
}

export async function purchasePackage() {
  return {
    success: false,
    error: 'Unavailable in this build',
  };
}

export async function restorePurchases() {
  return {
    success: false,
    error: 'Unavailable in this build',
  };
}
