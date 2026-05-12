import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://eahaapkuhshgokrxmsop.supabase.co',
  'sb_publishable_Tc9FOH9tF7ezuRlUkFquwQ_wc7qGp10',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)