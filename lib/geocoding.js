import { getFallbackCityCoords } from './cityFallbacks';

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
