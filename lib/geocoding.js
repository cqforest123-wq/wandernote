import * as Location from 'expo-location';
import { getFallbackCityCoords } from './cityFallbacks';
import { logEvent } from './diagnostics';

async function nominatimSearch(queryText) {
  const query = encodeURIComponent(queryText);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WanderNote/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data?.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  } catch (e) {
    clearTimeout(timer);
  }

  return null;
}

/**
 * 由坐标反查地名。照片里有的是 GPS，但用户要看的是「京都」而不是一串小数。
 *
 * Nominatim 的使用条款是每秒最多一次请求，所以调用方必须按天聚类后
 * 每簇只查一次，不要每张照片都查。
 */
/**
 * Ask the platform first.
 *
 * Apple's geocoder is on-device-brokered, needs no third-party host, and works
 * where Apple Maps works — including places that cannot reach
 * nominatim.openstreetmap.org at all. Photo imports in mainland China were
 * spending six seconds per day timing out against Nominatim and naming nothing.
 */
export async function reverseGeocodeApple(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let results;

  try {
    results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
  } catch (e) {
    // Say what went wrong. This used to swallow the error and return null,
    // which made an Apple failure indistinguishable from Apple simply not
    // knowing the place — and sent every lookup on to a six-second Nominatim
    // timeout without ever recording why.
    logEvent('geocode', 'apple-threw', {
      message: String(e?.message || e).slice(0, 80),
    });
    return null;
  }

  const first = results?.[0];

  if (!first) {
    logEvent('geocode', 'apple-empty', { results: results?.length ?? 0 });
    return null;
  }

  const city =
    first.city || first.subregion || first.district || first.region || '';
  const country = first.country || '';

  if (!city && !country) {
    logEvent('geocode', 'apple-unnamed', {
      keys: Object.keys(first)
        .filter(key => first[key])
        .slice(0, 8),
    });
    return null;
  }

  return { city: String(city), country: String(country) };
}

export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const apple = await reverseGeocodeApple(lat, lng);
  if (apple) return apple;

  return reverseGeocodeNominatim(lat, lng);
}

export async function reverseGeocodeNominatim(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WanderNote/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    const a = data?.address;
    if (!a) return null;

    // 从最具体退到最宽泛：郊外或山里拍的照片往往只有 county 一级
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state || '';
    const country = a.country || '';

    if (!city && !country) return null;
    return { city: String(city), country: String(country) };
  } catch (e) {
    clearTimeout(timer);
    logEvent('geocode', 'nominatim-failed', {
      // `AbortError` here means the 6s timeout fired, which is what mainland
      // China looks like: the host is simply unreachable.
      reason: String(e?.name || e?.message || e).slice(0, 40),
    });
    return null;
  }
}

export async function geocodeCity(cityName, countryName = '') {
  const fallback = getFallbackCityCoords(cityName, countryName);

  if (fallback) return fallback;

  const city = String(cityName || '').trim();
  const country = String(countryName || '').trim();

  const queries = [
    `${city} ${country}`.trim(),
    `${city}, ${country}`.trim(),
    city,
  ].filter(Boolean);

  for (const queryText of queries) {
    const coords = await nominatimSearch(queryText);
    if (coords) return coords;
  }

  return null;
}
