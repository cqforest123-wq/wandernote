import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { STORAGE_KEYS } from './storageKeys';

export const BACKUP_FORMAT = 'wandernote-backup';
export const BACKUP_VERSION = 1;

// 超过这个体积就先问用户要不要带上照片，避免在旧设备上把整个 JSON 拼进内存时崩掉。
export const PHOTO_SIZE_WARN_BYTES = 40 * 1024 * 1024;

function parseStored(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    console.warn('备份：本地数据解析失败', e.message);
    return fallback;
  }
}

async function readLocalData() {
  const [tripsRaw, memosRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.trips),
    AsyncStorage.getItem(STORAGE_KEYS.memos),
  ]);
  return {
    trips: parseStored(tripsRaw, []),
    memos: parseStored(memosRaw, []),
  };
}

function collectPhotos(trips) {
  const out = [];
  for (const trip of trips) {
    for (const day of trip?.days || []) {
      for (const photo of day?.photos || []) {
        if (photo?.uri) out.push(photo);
      }
    }
  }
  return out;
}

/**
 * 估算把照片一并打包后的体积。
 * 相机拍的照片只存在 app 沙盒里，系统相册没有副本，所以不带上就等于丢了。
 */
export async function estimatePhotoBytes(trips) {
  const photos = collectPhotos(trips);
  let bytes = 0;
  let missing = 0;

  for (const photo of photos) {
    try {
      const file = new File(photo.uri);
      if (file.exists) {
        bytes += file.size || 0;
      } else {
        missing += 1;
      }
    } catch (e) {
      missing += 1;
    }
  }

  // base64 大约膨胀 4/3
  return { count: photos.length, rawBytes: bytes, encodedBytes: Math.round(bytes * 1.34), missing };
}

/**
 * 读出每张照片的 base64。失败的跳过而不是整个导出失败 ——
 * 少一张照片也比完全没有备份强。
 */
function encodePhotos(trips) {
  const encoded = {};
  let failed = 0;

  for (const trip of trips) {
    for (const day of trip?.days || []) {
      for (const photo of day?.photos || []) {
        if (!photo?.uri || encoded[photo.id]) continue;
        try {
          const file = new File(photo.uri);
          if (!file.exists) { failed += 1; continue; }
          encoded[photo.id] = {
            data: file.base64Sync(),
            name: file.name,
          };
        } catch (e) {
          failed += 1;
        }
      }
    }
  }

  return { encoded, failed };
}

export async function buildBackup({ includePhotos = true } = {}) {
  const { trips, memos } = await readLocalData();
  const payload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    trips,
    memos,
  };

  let photoFailed = 0;
  if (includePhotos) {
    const { encoded, failed } = encodePhotos(trips);
    payload.photos = encoded;
    photoFailed = failed;
  }

  return { payload, tripCount: trips.length, memoCount: memos.length, photoFailed };
}

function timestampName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `wandernote-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}

/**
 * 写到 cache 目录再走系统分享面板，用户可以存到「文件」、iCloud 或发给自己。
 * cache 目录的好处是系统在空间紧张时会自己清理，不会长期占用户空间。
 */
export async function exportBackup({ includePhotos = true } = {}) {
  const { payload, tripCount, memoCount, photoFailed } = await buildBackup({ includePhotos });

  const file = new File(Paths.cache, timestampName());
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
  });

  return { tripCount, memoCount, photoFailed, bytes: file.size };
}

function isValidBackup(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.format === BACKUP_FORMAT &&
    Array.isArray(data.trips)
  );
}

/**
 * 把备份里的照片写回沙盒，返回 旧 id -> 新本地 uri 的映射。
 * 备份里的原始 uri 在重装后已经失效，必须重新落盘再改写引用。
 */
function restorePhotos(photos) {
  const map = {};
  if (!photos) return map;

  const dir = Paths.document;
  for (const [id, entry] of Object.entries(photos)) {
    if (!entry?.data) continue;
    try {
      const name = `restored-${id}-${entry.name || 'photo.jpg'}`.replace(/[^\w.-]/g, '_');
      const file = new File(dir, name);
      file.create({ overwrite: true });
      // 交给原生按 base64 落盘，不在 JS 里解码，省内存也不依赖 atob
      file.write(entry.data, { encoding: 'base64' });
      map[id] = file.uri;
    } catch (e) {
      // 照片恢复失败不影响文字内容的恢复
    }
  }
  return map;
}

function remapPhotoUris(trips, photoMap) {
  if (!Object.keys(photoMap).length) return trips;
  return trips.map((trip) => ({
    ...trip,
    days: (trip.days || []).map((day) => ({
      ...day,
      photos: (day.photos || []).map((photo) =>
        photoMap[photo.id] ? { ...photo, uri: photoMap[photo.id] } : photo
      ),
    })),
  }));
}

/**
 * 合并导入，绝不覆盖已有内容。
 *
 * 旅行记录是用户最不能承受丢失的东西，所以这里只做「补齐缺的」：
 * id 已存在的一律跳过，本机数据永远优先。想完整还原就在空 app 上导入。
 */
export async function importBackup() {
  const picked = await File.pickFileAsync(undefined, 'application/json');
  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    throw new Error('INVALID_JSON');
  }

  if (!isValidBackup(data)) {
    throw new Error('NOT_A_BACKUP');
  }

  const { trips: currentTrips, memos: currentMemos } = await readLocalData();

  const photoMap = restorePhotos(data.photos);
  const incomingTrips = remapPhotoUris(data.trips, photoMap);

  const existingTripIds = new Set(currentTrips.map((t) => String(t.id)));
  const newTrips = incomingTrips.filter((t) => !existingTripIds.has(String(t.id)));

  const incomingMemos = Array.isArray(data.memos) ? data.memos : [];
  const existingMemoIds = new Set(currentMemos.map((m) => String(m.id)));
  const newMemos = incomingMemos.filter((m) => !existingMemoIds.has(String(m.id)));

  const mergedTrips = [...currentTrips, ...newTrips];
  const mergedMemos = [...currentMemos, ...newMemos];

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.trips, JSON.stringify(mergedTrips)],
    [STORAGE_KEYS.memos, JSON.stringify(mergedMemos)],
  ]);

  return {
    trips: mergedTrips,
    addedTrips: newTrips.length,
    skippedTrips: incomingTrips.length - newTrips.length,
    addedMemos: newMemos.length,
    skippedMemos: incomingMemos.length - newMemos.length,
    restoredPhotos: Object.keys(photoMap).length,
  };
}
