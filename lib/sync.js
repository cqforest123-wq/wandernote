import { STORAGE_KEYS } from './storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const TRIPS_KEY = STORAGE_KEYS.trips;
const MEMOS_KEY = STORAGE_KEYS.memos;

// 上传旅程到云端
export async function syncTripsUp(userId, trips) {
  if (!userId) return;
  try {
    if (!trips?.length) {
      // 空数组：主动清空云端该用户所有旅程
      const { error } = await supabase.from('trips').delete().eq('user_id', userId);
      if (error) console.log('syncTripsUp clear error:', error.message);
      return;
    }
    const rows = trips.map(t => ({
      id: t.id,
      user_id: userId,
      data: t,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('trips').upsert(rows, { onConflict: 'id' });
    if (error) console.log('syncTripsUp error:', error.message);
  } catch (e) {
    console.log('syncTripsUp exception:', e.message);
  }
}

// 从云端拉取旅程
export async function syncTripsDown(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error || !data?.length) return null;
    const trips = data.map(r => r.data);
    await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    return trips;
  } catch (e) {
    console.log('syncTripsDown exception:', e.message);
    return null;
  }
}

// 上传打包清单到云端
export async function syncMemosUp(userId, memos) {
  if (!userId) return;
  try {
    if (!memos?.length) {
      // 空数组：主动清空云端该用户所有打包清单
      const { error } = await supabase.from('packing_lists').delete().eq('user_id', userId);
      if (error) console.log('syncMemosUp clear error:', error.message);
      return;
    }
    const rows = memos.map(m => ({
      id: m.id,
      user_id: userId,
      data: m,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('packing_lists').upsert(rows, { onConflict: 'id' });
    if (error) console.log('syncMemosUp error:', error.message);
  } catch (e) {
    console.log('syncMemosUp exception:', e.message);
  }
}

// 从云端拉取打包清单
export async function syncMemosDown(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('packing_lists')
      .select('data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error || !data?.length) return null;
    const memos = data.map(r => r.data);
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
    return memos;
  } catch (e) {
    console.log('syncMemosDown exception:', e.message);
    return null;
  }
}

// 启动时同步：先拉云端，没有则用本地
export async function initSync(userId) {
  if (!userId) return { trips: null, memos: null };
  const [trips, memos] = await Promise.all([
    syncTripsDown(userId),
    syncMemosDown(userId),
  ]);
  return { trips, memos };
}

// 删除旅程及所有关联数据（云端显式删除 + 本地清理）
export async function deleteTripAndRelated(userId, tripId) {
  if (!userId) throw new Error('deleteTripAndRelated: missing userId');
  if (!tripId) throw new Error('deleteTripAndRelated: missing tripId');

  // 1. 显式删除云端 packing_lists（不依赖级联）
  const { error: packingError } = await supabase
    .from('packing_lists')
    .delete()
    .eq('user_id', userId)
    .eq('trip_id', tripId);
  if (packingError) throw packingError;

  // 2. 删除云端旅程
  const { error: tripError } = await supabase
    .from('trips')
    .delete()
    .eq('user_id', userId)
    .eq('id', tripId);
  if (tripError) throw tripError;

  // 3. 清理本地关联打包清单
  let deletedLocalMemos = 0;
  try {
    const raw = await AsyncStorage.getItem(MEMOS_KEY);
    if (raw) {
      let memos;
      try {
        memos = JSON.parse(raw);
      } catch (e) {
        console.warn('deleteTripAndRelated: 本地memos数据损坏，跳过清理:', e.message);
        memos = [];
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

  return { deletedTrip: true, deletedPackingLists: true, deletedLocalMemos };
}

// 上传打包清单时同步写入 trip_id
export async function syncMemosUpWithTripId(userId, memos) {
  if (!userId) return;
  if (!memos?.length) {
    // 空数组时不操作，由 deleteTripAndRelated 负责清理
    return;
  }
  try {
    const rows = memos.map(m => ({
      id: m.id,
      user_id: userId,
      data: m,
      trip_id: m.tripId || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('packing_lists').upsert(rows, { onConflict: 'id' });
    if (error) console.log('syncMemosUpWithTripId error:', error.message);
  } catch (e) {
    console.log('syncMemosUpWithTripId exception:', e.message);
  }
}
