import * as MediaLibrary from 'expo-media-library';

/**
 * Recover where photos were taken.
 *
 * iOS hands picked images to the app through PHPicker, which strips GPS from
 * the file for privacy — the timestamp survives but the location does not. The
 * picker does return an `assetId`, and with photo-library access that can be
 * resolved back to the real coordinates.
 *
 * Everything here degrades quietly: no permission, no asset id, or a photo that
 * genuinely has no location all end the same way — that photo simply has no
 * coordinates, and the trip is built from the dates alone.
 */

/** Nominatim-free, purely local, but still one system call per photo. */
const MAX_LOOKUPS = 300;

export async function canReadPhotoLocations() {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();

    return status === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * Ask for the library access needed to read coordinates.
 * Returns false rather than throwing — the caller carries on without location.
 */
export async function requestPhotoLocationAccess() {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();

    return status === 'granted';
  } catch (e) {
    return false;
  }
}

async function locationFor(assetId) {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId);
    const lat = Number(info?.location?.latitude);
    const lng = Number(info?.location?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    // 0,0 is the Gulf of Guinea; in practice it means "no fix".
    if (lat === 0 && lng === 0) {
      return null;
    }

    return { lat, lng };
  } catch (e) {
    return null;
  }
}

/**
 * Fill in `asset.exif` GPS for picked assets, in place of what PHPicker removed.
 *
 * Returns a new array so callers keep the originals untouched, shaped so the
 * existing EXIF parser finds the coordinates without changes.
 */
export async function attachPhotoLocations(assets, { onProgress } = {}) {
  const list = Array.isArray(assets) ? assets : [];

  if (list.length === 0 || !(await canReadPhotoLocations())) {
    return list;
  }

  const out = [];
  let looked = 0;

  for (let i = 0; i < list.length; i += 1) {
    const asset = list[i];
    const alreadyHas =
      asset?.exif &&
      (asset.exif['{GPS}'] || asset.exif.GPS || asset.exif.GPSLatitude);

    if (alreadyHas || !asset?.assetId || looked >= MAX_LOOKUPS) {
      out.push(asset);
      continue;
    }

    looked += 1;
    onProgress?.({ done: looked, total: Math.min(list.length, MAX_LOOKUPS) });

    const coords = await locationFor(asset.assetId);

    if (!coords) {
      out.push(asset);
      continue;
    }

    out.push({
      ...asset,
      exif: {
        ...(asset.exif || {}),
        '{GPS}': {
          Latitude: Math.abs(coords.lat),
          LatitudeRef: coords.lat >= 0 ? 'N' : 'S',
          Longitude: Math.abs(coords.lng),
          LongitudeRef: coords.lng >= 0 ? 'E' : 'W',
        },
      },
    });
  }

  return out;
}
