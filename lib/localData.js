import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

let pendingWrite = Promise.resolve();

function enqueueWrite(operation) {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => {});
  return result;
}

async function readCollection(key) {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error('Invalid local collection');
  return records;
}

async function loadCollection(key) {
  await pendingWrite;
  return readCollection(key);
}

async function saveCollection(key, records) {
  if (!Array.isArray(records)) throw new Error('Invalid local collection');
  const json = JSON.stringify(records);
  return enqueueWrite(() => AsyncStorage.setItem(key, json));
}

export const loadLocalTrips = () => loadCollection(STORAGE_KEYS.trips);
export const loadLocalMemos = () => loadCollection(STORAGE_KEYS.memos);
export const saveLocalTrips = records => saveCollection(STORAGE_KEYS.trips, records);
export const saveLocalMemos = records => saveCollection(STORAGE_KEYS.memos, records);

export function clearLocalData() {
  return enqueueWrite(() => AsyncStorage.multiRemove([
    STORAGE_KEYS.trips,
    STORAGE_KEYS.memos,
    '@wn_nickname',
    '@wn_avatar',
  ]));
}

export function removeLocalPackingListsForTrip(tripId) {
  if (tripId === null || tripId === undefined || tripId === '') {
    return Promise.reject(new Error('Missing trip identifier'));
  }
  return enqueueWrite(async () => {
    const memos = await readCollection(STORAGE_KEYS.memos);
    const remaining = memos.filter(memo =>
      !(memo.category === 'packing' && String(memo.tripId) === String(tripId))
    );
    await AsyncStorage.setItem(STORAGE_KEYS.memos, JSON.stringify(remaining));
  });
}
