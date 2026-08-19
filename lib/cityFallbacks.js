const CITY_COORDS = {
  // China core fallback cities
  'guiyang': { lat: 26.6470, lng: 106.6302 },
  '贵阳': { lat: 26.6470, lng: 106.6302 },
  'guiyang guizhou': { lat: 26.6470, lng: 106.6302 },
  '贵阳 贵州': { lat: 26.6470, lng: 106.6302 },

  'beijing': { lat: 39.9042, lng: 116.4074 },
  '北京': { lat: 39.9042, lng: 116.4074 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  'guangzhou': { lat: 23.1291, lng: 113.2644 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  'shenzhen': { lat: 22.5431, lng: 114.0579 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  'chongqing': { lat: 29.5630, lng: 106.5516 },
  '重庆': { lat: 29.5630, lng: 106.5516 },
  'chengdu': { lat: 30.5728, lng: 104.0668 },
  '成都': { lat: 30.5728, lng: 104.0668 },

  // Common global fallback cities
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'osaka': { lat: 34.6937, lng: 135.5023 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  '香港': { lat: 22.3193, lng: 114.1694 },
  'taipei': { lat: 25.0330, lng: 121.5654 },
  '台北': { lat: 25.0330, lng: 121.5654 },

  'london': { lat: 51.5072, lng: -0.1276 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'honolulu': { lat: 21.3099, lng: -157.8581 },
  'oahu': { lat: 21.4389, lng: -158.0001 },
  'anchorage': { lat: 61.2176, lng: -149.8997 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
};

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[，,]/g, ' ')
    .replace(/[·|/]/g, ' ')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitCompositeCity(value) {
  return String(value || '')
    .split(/[·|/,，、]/)
    .map(part => part.trim())
    .filter(Boolean);
}

export function getFallbackCityCoords(cityName, countryName = '') {
  const cityParts = splitCompositeCity(cityName);
  const candidates = [
    cityName,
    ...cityParts,
    `${cityName} ${countryName}`,
    ...cityParts.map(city => `${city} ${countryName}`),
  ]
    .map(normalizeName)
    .filter(Boolean);

  for (const key of candidates) {
    if (CITY_COORDS[key]) return CITY_COORDS[key];
  }

  return null;
}

export function hasFallbackCityCoords(cityName, countryName = '') {
  return Boolean(getFallbackCityCoords(cityName, countryName));
}
