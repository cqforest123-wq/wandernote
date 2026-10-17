import * as FileSystem from 'expo-file-system/legacy';

const MEDIA_FOLDER = 'wandernote-media/';
let sequence = 0;

function mediaDirectory() {
  if (!FileSystem.documentDirectory) throw new Error('Local documents unavailable');
  return `${FileSystem.documentDirectory}${MEDIA_FOLDER}`;
}

export async function storeLocalMedia(uri) {
  if (typeof uri !== 'string' || !/^(file|content|ph):/.test(uri)) {
    throw new Error('Expected a local media file');
  }
  const directory = mediaDirectory();
  if (uri.startsWith(directory)) return uri;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const extension = uri.split('?')[0].match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] || '.bin';
  const target = `${directory}${Date.now()}-${++sequence}${extension}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch (error) {
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
    throw error;
  }
}

export async function clearLocalMedia() {
  await FileSystem.deleteAsync(mediaDirectory(), { idempotent: true });
}

export async function preserveExistingMedia(uri) {
  if (typeof uri !== 'string' || !uri.startsWith('file:')) return uri;
  try {
    let source = uri;
    // iOS can change the sandbox UUID during an app update.
    if (!(await FileSystem.getInfoAsync(source)).exists) {
      const documents = uri.indexOf('/Documents/');
      const caches = uri.indexOf('/Library/Caches/');
      if (documents !== -1) source = `${FileSystem.documentDirectory}${uri.slice(documents + 11)}`;
      else if (caches !== -1) source = `${FileSystem.cacheDirectory}${uri.slice(caches + 16)}`;
      if (!(await FileSystem.getInfoAsync(source)).exists) return uri;
    }
    return await storeLocalMedia(source);
  } catch {
    // Never discard an old record if its media is missing or storage is full.
    return uri;
  }
}

export async function preserveTripMedia(trips) {
  let changed = false;
  const next = [];
  for (const trip of trips) {
    const days = [];
    for (const day of trip.days || []) {
      const media = {};
      for (const key of ['photos', 'videos']) {
        if (!Array.isArray(day[key])) continue;
        media[key] = [];
        for (const item of day[key]) {
          const uri = await preserveExistingMedia(item.uri);
          changed ||= uri !== item.uri;
          media[key].push(uri === item.uri ? item : { ...item, uri });
        }
      }
      days.push({ ...day, ...media });
    }
    next.push({ ...trip, days });
  }
  return changed ? next : trips;
}
