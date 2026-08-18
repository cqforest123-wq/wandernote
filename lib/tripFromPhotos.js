import { reverseGeocode } from './geocoding';
import { createPhoto } from './models';
import { logEvent } from './diagnostics';

// Nominatim 的使用条款是每秒最多一次请求。按天聚类后每簇查一次，
// 中间强制间隔，宁可慢一点也不要被封。
const GEOCODE_INTERVAL_MS = 1100;

const pad = (n) => String(n).padStart(2, '0');

function formatDate(d) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

const WEEKDAY_KEYS = ['weekday_sun', 'weekday_mon', 'weekday_tue', 'weekday_wed', 'weekday_thu', 'weekday_fri', 'weekday_sat'];

/**
 * EXIF 的 DateTimeOriginal 格式是 "2026:03:15 07:30:12" —— 冒号分隔日期，
 * 直接给 Date 解析会得到 Invalid Date。
 */
export function parseExifDate(exif) {
  const raw = exif?.DateTimeOriginal || exif?.DateTimeDigitized || exif?.DateTime;
  if (typeof raw === 'string') {
    const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const loose = new Date(raw);
    if (!Number.isNaN(loose.getTime())) return loose;
  }
  return null;
}

/**
 * GPS 在 EXIF 里的位置和形态随平台而变：iOS 放在 {GPS} 字典里，
 * 键名带或不带 GPS 前缀都见过，纬度还要靠 Ref 决定正负。
 */
export function parseExifCoords(exif) {
  if (!exif) return null;
  const gps = exif['{GPS}'] || exif.GPS || exif;

  const lat = Number(gps.Latitude ?? gps.GPSLatitude);
  const lng = Number(gps.Longitude ?? gps.GPSLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  const latRef = String(gps.LatitudeRef ?? gps.GPSLatitudeRef ?? 'N').toUpperCase();
  const lngRef = String(gps.LongitudeRef ?? gps.GPSLongitudeRef ?? 'E').toUpperCase();

  return {
    lat: latRef.startsWith('S') ? -Math.abs(lat) : Math.abs(lat),
    lng: lngRef.startsWith('W') ? -Math.abs(lng) : Math.abs(lng),
  };
}

/**
 * 把选中的照片整理成「按天分组」的结构。
 * 没有拍摄时间的照片归到 undated，交给调用方决定怎么处理。
 */
export function groupPhotosByDay(assets, t) {
  const byDate = new Map();
  const undated = [];

  for (const asset of assets || []) {
    if (!asset?.uri) continue;
    const taken = parseExifDate(asset.exif);
    const coords = parseExifCoords(asset.exif);
    const entry = { uri: asset.uri, coords };

    if (!taken) { undated.push(entry); continue; }

    const key = formatDate(taken);
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, weekDay: t(WEEKDAY_KEYS[taken.getDay()]), takenAt: taken, photos: [], coordsList: [] });
    }
    const day = byDate.get(key);
    day.photos.push(entry);
    if (coords) day.coordsList.push(coords);
    if (taken < day.takenAt) day.takenAt = taken;
  }

  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { days, undated };
}

function averageCoords(list) {
  if (!list.length) return null;
  const sum = list.reduce((acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / list.length, lng: sum.lng / list.length };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 从照片构建一个旅程草稿。
 *
 * 刻意只返回草稿而不直接写库：目的地是猜出来的，用户应该先看一眼再确认。
 * 没有 GPS 时仍然把「天」分好 —— 分好天本身就省掉大部分录入工作，
 * 目的地留空让用户填即可，不该因为缺 GPS 就整个失败。
 */
export async function buildTripDraftFromPhotos(assets, t, { onProgress } = {}) {
  const { days, undated } = groupPhotosByDay(assets, t);

  if (!days.length && !undated.length) {
    return { error: 'NO_USABLE_PHOTOS' };
  }

  // 没有一张带时间：无法分天，但仍可当成单日旅程
  const effectiveDays = days.length
    ? days
    : [{ date: formatDate(new Date()), weekDay: t(WEEKDAY_KEYS[new Date().getDay()]), photos: undated, coordsList: [] }];

  // 有时间的照片按天分好后，没时间的并入第一天，不丢照片
  if (days.length && undated.length) {
    effectiveDays[0].photos.push(...undated);
  }

  const daysWithCoords = effectiveDays.filter((d) => d.coordsList.length);
  let resolvedPlace = null;
  let geocodedDays = 0;

  // Coordinates and a *name* for them are separate problems. hasLocation
  // reports the name, so a working GPS read with a failing lookup looked
  // identical to no location at all.
  const geocodeStartedAt = Date.now();
  logEvent('photo-import', 'geocoding', {
    days: effectiveDays.length,
    daysWithCoords: daysWithCoords.length,
  });

  for (let i = 0; i < daysWithCoords.length; i++) {
    const center = averageCoords(daysWithCoords[i].coordsList);
    onProgress && onProgress({ done: i, total: daysWithCoords.length });

    // Keep the coordinates whatever the name lookup does. We know where these
    // photos were taken; failing to find a *label* for that spot is no reason
    // to throw the position away — the map, the footprint and the destination
    // weather all need the position, not the name.
    daysWithCoords[i].center = center;

    const place = await reverseGeocode(center.lat, center.lng).catch((error) => {
      logEvent('photo-import', 'geocode-failed', {
        message: String(error?.message || error).slice(0, 60),
      });
      return null;
    });
    if (place) {
      daysWithCoords[i].place = place;
      geocodedDays++;
      if (!resolvedPlace) resolvedPlace = place;
    }
    if (i < daysWithCoords.length - 1) await sleep(GEOCODE_INTERVAL_MS);
  }

  logEvent('photo-import', 'geocoded', {
    tried: daysWithCoords.length,
    named: geocodedDays,
    ms: Date.now() - geocodeStartedAt,
  });

  // 出现最多的地名作为整个旅程的目的地
  const counts = new Map();
  for (const d of effectiveDays) {
    if (!d.place) continue;
    const key = `${d.place.city}|${d.place.country}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let topPlace = resolvedPlace;
  let top = 0;
  for (const [key, n] of counts) {
    if (n > top) {
      top = n;
      const [city, country] = key.split('|');
      topPlace = { city, country };
    }
  }

  const centerDay = effectiveDays.find((d) => d.center);

  return {
    city: topPlace?.city || '',
    country: topPlace?.country || '',
    coords: centerDay?.center || null,
    days: effectiveDays.map((d) => ({
      date: d.date,
      weekDay: d.weekDay,
      memos: [],
      photos: d.photos.map((p) => createPhoto({ uri: p.uri, coords: p.coords, takenAt: d.takenAt })),
    })),
    stats: {
      photoCount: (assets || []).length,
      dayCount: effectiveDays.length,
      undatedCount: days.length ? undated.length : 0,
      locatedDays: geocodedDays,
      hasLocation: Boolean(topPlace),
      // Position is known even when the name is not; the two failed together
      // before, which made a working GPS read look like no location at all.
      hasCoords: Boolean(centerDay?.center),
    },
  };
}
