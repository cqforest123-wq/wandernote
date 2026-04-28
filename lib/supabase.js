import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://qwzidwlccilhyawnvszx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3emlkd2xjY2lsaHlhd252c3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDU5NDAsImV4cCI6MjA5MjkyMTk0MH0.BrfU67jlyArYcq5j_UJfSVclUwIXUYNUXOFBRhLdgtc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
