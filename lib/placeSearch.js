import { geocodeCity } from './geocoding';

export async function searchPlaces(queryText) {
  const query = String(queryText || '').replace(/\s+/g, ' ').trim();
  if (query.length < 2) return [];
  const coords = await geocodeCity(query);
  if (!coords) return [];
  return [{
    id: `${coords.lat},${coords.lng}`,
    name: query,
    displayName: query,
    country: '',
    coords,
  }];
}
