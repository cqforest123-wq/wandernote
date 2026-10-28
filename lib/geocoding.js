import { geocodeAsync } from 'expo-location';
import { getFallbackCityCoords } from './cityFallbacks';

const coordinateCache = new Map();
const pendingRequests = new Map();
let requestQueue = Promise.resolve();

export async function lookupPlaceCoordinates(queryText, timeoutMs = 5000) {
  const query = String(queryText || '').replace(/\s+/g, ' ').trim();
  if (!query) return null;
  const key = query.toLocaleLowerCase();
  if (coordinateCache.has(key)) return coordinateCache.get(key);

  if (!pendingRequests.has(key)) {
    // Keep native calls serialized, including calls that outlive the UI timeout.
    const request = requestQueue.then(async () => {
      try {
        const results = await geocodeAsync(query);
        const match = results.find(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
          && Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180);
        if (!match) return null;
        const coords = { lat: match.latitude, lng: match.longitude };
        if (coordinateCache.size >= 100) coordinateCache.delete(coordinateCache.keys().next().value);
        coordinateCache.set(key, coords);
        return coords;
      } catch {
        return null;
      } finally {
        pendingRequests.delete(key);
      }
    });
    pendingRequests.set(key, request);
    requestQueue = request;
  }

  let timer;
  try {
    return await Promise.race([
      pendingRequests.get(key),
      new Promise(resolve => { timer = setTimeout(() => resolve(null), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeCity(cityName, countryName = '') {
  const city = String(cityName || '').trim();
  const country = String(countryName || '').trim();
  if (!city) return null;
  return getFallbackCityCoords(city, country) || lookupPlaceCoordinates([city, country].filter(Boolean).join(', '));
}
