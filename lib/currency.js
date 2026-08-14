import AsyncStorage from '@react-native-async-storage/async-storage';

export {
  COMMON_CURRENCIES,
  collectTripExpenses,
  convert,
  currencySymbol,
  formatMoney,
  sumByCategory,
  sumExpenses,
} from './currencyMath';

const RATES_KEY = '@wandernote_fx_rates';
const HOME_CURRENCY_KEY = '@wandernote_home_currency';

// Free, no API key, updated daily. Rates are quoted against USD.
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const RATES_BASE = 'USD';
const FETCH_TIMEOUT_MS = 8000;

/** Rates older than this are still used offline, but flagged as stale. */
export const RATES_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_HOME_CURRENCY = 'CNY';

export async function getHomeCurrency() {
  try {
    const saved = await AsyncStorage.getItem(HOME_CURRENCY_KEY);

    return saved || DEFAULT_HOME_CURRENCY;
  } catch (e) {
    return DEFAULT_HOME_CURRENCY;
  }
}

export async function setHomeCurrency(code) {
  try {
    await AsyncStorage.setItem(HOME_CURRENCY_KEY, code);
  } catch (e) {
    console.warn('保存本币失败:', e.message);
  }
}

async function readCachedRates() {
  try {
    const raw = await AsyncStorage.getItem(RATES_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed.rates !== 'object' || !parsed.rates) {
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Latest rates, preferring the network but falling back to whatever was cached.
 *
 * Travel is exactly when connectivity is worst, so a failed fetch must never
 * blank out the totals. The `stale` flag lets the UI say the rate is from an
 * earlier day rather than presenting it as current.
 *
 * Returns null only when there is no network *and* nothing was ever cached, in
 * which case the caller shows original currencies rather than inventing a
 * conversion.
 */
export async function loadRates({ forceRefresh = false } = {}) {
  const cached = await readCachedRates();
  const now = Date.now();
  const cacheIsFresh =
    cached && now - Number(cached.fetchedAt || 0) < RATES_STALE_AFTER_MS;

  if (cached && cacheIsFresh && !forceRefresh) {
    return { ...cached, stale: false };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(RATES_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    if (!json || json.result === 'error' || !json.rates) {
      throw new Error('malformed rate response');
    }

    const payload = {
      base: json.base_code || RATES_BASE,
      rates: json.rates,
      fetchedAt: now,
    };

    await AsyncStorage.setItem(RATES_KEY, JSON.stringify(payload)).catch(
      () => {}
    );

    return { ...payload, stale: false };
  } catch (e) {
    if (cached) {
      return { ...cached, stale: true };
    }

    return null;
  }
}
