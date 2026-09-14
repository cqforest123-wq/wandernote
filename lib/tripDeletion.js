import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

const MEMOS_KEY = STORAGE_KEYS.memos;

/**
 * Remove what belongs to a trip besides the trip itself.
 *
 * The caller drops the trip from state, which persists it. Packing lists live
 * under a separate key and name their trip by id, so they would outlive it
 * and resurface as orphans in the Lists tab.
 *
 * This used to delete the cloud copy first and refuse to touch local data if
 * that failed. Since 1.2 there is no cloud copy.
 */
export async function deleteTripAndRelated(tripId) {
  if (!tripId) throw new Error('deleteTripAndRelated: missing tripId');

  let deletedLocalMemos = 0;

  try {
    const raw = await AsyncStorage.getItem(MEMOS_KEY);

    if (raw) {
      let memos;

      try {
        memos = JSON.parse(raw);
      } catch (e) {
        // Leave a corrupt value alone rather than overwrite it with nothing.
        console.warn('deleteTripAndRelated: stored lists are unreadable, skipping cleanup:', e.message);
        return { deletedTrip: true, deletedLocalMemos: 0 };
      }

      const filtered = memos.filter(
        m => !(m.category === 'packing' && String(m.tripId) === String(tripId))
      );
      deletedLocalMemos = memos.length - filtered.length;
      await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('deleteTripAndRelated local cleanup error:', e.message);
  }

  return { deletedTrip: true, deletedLocalMemos };
}
