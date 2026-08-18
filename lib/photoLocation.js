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

/** @returns {{coords: {lat:number,lng:number}|null, error?: string}} */
async function locationFor(assetId) {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId);
    const lat = Number(info?.location?.latitude);
    const lng = Number(info?.location?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { coords: null };
    }

    // 0,0 is the Gulf of Guinea; in practice it means "no fix".
    if (lat === 0 && lng === 0) {
      return { coords: null };
    }

    return { coords: { lat, lng } };
  } catch (e) {
    return { coords: null, error: String(e?.message || e).slice(0, 70) };
  }
}

/**
 * Fill in `asset.exif` GPS for picked assets, in place of what PHPicker removed.
 *
 * Returns the enriched assets plus what actually happened, so the caller can
 * tell the user *why* there are no locations. "These photos have no location"
 * and "you didn't grant access" look identical on screen otherwise, and only
 * one of them is the user's to fix.
 */
export async function attachPhotoLocations(assets, { onProgress } = {}) {
  const list = Array.isArray(assets) ? assets : [];
  const stats = {
    permission: 'granted',
    // Photos we could have looked up: they carry an asset id and had no GPS.
    candidates: 0,
    resolved: 0,
    // Why the rest were not looked up / did not resolve.
    skippedHadGpsKey: 0,
    skippedNoAssetId: 0,
    lookupFailed: 0,
    lookupNoLocation: 0,
  };

  if (list.length === 0) {
    return { assets: list, stats };
  }

  if (!(await canReadPhotoLocations())) {
    stats.permission = 'denied';
    return { assets: list, stats };
  }

  const out = [];
  let looked = 0;

  for (let i = 0; i < list.length; i += 1) {
    const asset = list[i];
    const alreadyHas =
      asset?.exif &&
      (asset.exif['{GPS}'] || asset.exif.GPS || asset.exif.GPSLatitude);

    if (alreadyHas || !asset?.assetId || looked >= MAX_LOOKUPS) {
      if (alreadyHas) {
        stats.skippedHadGpsKey += 1;
      } else if (!asset?.assetId) {
        stats.skippedNoAssetId += 1;
      }
      out.push(asset);
      continue;
    }

    stats.candidates += 1;
    looked += 1;
    onProgress?.({ done: looked, total: Math.min(list.length, MAX_LOOKUPS) });

    const outcome = await locationFor(asset.assetId);

    if (!outcome.coords) {
      if (outcome.error) {
        stats.lookupFailed += 1;
        stats.lastError = outcome.error;
      } else {
        stats.lookupNoLocation += 1;
      }
      out.push(asset);
      continue;
    }

    const coords = outcome.coords;

    stats.resolved += 1;
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

  return { assets: out, stats };
}
