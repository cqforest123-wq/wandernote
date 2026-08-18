import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from './diagnostics';

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
const UNITS_KEY = '@wandernote_units';

// Free, no API key, updated daily. Rates are quoted against USD.
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const RATES_BASE = 'USD';
const FETCH_TIMEOUT_MS = 8000;

/** Rates older than this are still used offline, but flagged as stale. */
export const RATES_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_HOME_CURRENCY = 'CNY';

/**
 * 'auto' follows the device region, which is the right default but is also
 * exactly what people want to override: someone whose phone is set to the US
 * while travelling still thinks in metres. Explicit beats clever here.
 */
export const UNIT_CHOICES = ['auto', 'metric', 'imperial'];

export async function getUnitPreference() {
  try {
    const saved = await AsyncStorage.getItem(UNITS_KEY);

    return UNIT_CHOICES.includes(saved) ? saved : 'auto';
  } catch (e) {
    return 'auto';
  }
}

export async function setUnitPreference(choice) {
  try {
    await AsyncStorage.setItem(
      UNITS_KEY,
      UNIT_CHOICES.includes(choice) ? choice : 'auto'
    );
  } catch (e) {
    console.warn('保存单位偏好失败:', e.message);
  }
}

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
    logEvent('rates', 'cache-hit', { ageMinutes: Math.round((now - cached.fetchedAt) / 60000) });
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

    logEvent('rates', 'fetched', { currencies: Object.keys(json.rates).length });
    return { ...payload, stale: false };
  } catch (e) {
    if (cached) {
      logEvent('rates', 'fetch-failed-using-cache', {
        ageHours: Math.round((now - cached.fetchedAt) / 3600000),
      });
      return { ...cached, stale: true };
    }

    logEvent('rates', 'unavailable', {});
    return null;
  }
}
