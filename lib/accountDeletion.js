import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { STORAGE_KEYS } from './storageKeys';

export async function deleteCurrentAccount() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData?.session?.access_token) {
    throw new Error('No active session');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.success !== true) {
    throw new Error('Account deletion failed');
  }

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.trips,
    STORAGE_KEYS.memos,
    '@wn_nickname',
    '@wn_avatar',
    '@wandernote_language',
  ]);

  await supabase.auth.signOut();

  return true;
}
