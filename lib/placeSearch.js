function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function pickPlaceName(item) {
  const address = item?.address || {};

  return normalizeText(
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.island ||
    address.attraction ||
    address.tourism ||
    address.suburb ||
    item?.name ||
    String(item?.display_name || '').split(',')[0]
  );
}

function pickCountry(item) {
  const address = item?.address || {};
  return normalizeText(address.country || '');
}

function pickPlaceType(item) {
  const type = item?.type || item?.class;
  return normalizeText(type || 'place');
}

export async function searchPlaces(queryText, language = 'en') {
  const query = normalizeText(queryText);

  if (query.length < 2) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=jsonv2` +
      `&addressdetails=1` +
      `&limit=6` +
      `&accept-language=${encodeURIComponent(language || 'en')}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WanderNote/1.0',
      },
      signal: controller.signal,
    });

    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data
      .map(item => {
        const lat = Number.parseFloat(item.lat);
        const lng = Number.parseFloat(item.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
          id: String(item.place_id || item.osm_id || `${lat},${lng}`),
          name: pickPlaceName(item) || query,
          displayName: normalizeText(item.display_name),
          country: pickCountry(item),
          type: pickPlaceType(item),
          coords: { lat, lng },
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
