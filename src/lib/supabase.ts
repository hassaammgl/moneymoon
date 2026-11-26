/**
 * Supabase client — the only module that knows the backend exists.
 *
 * Sessions live in expo-sqlite's localStorage shim (the Expo-recommended store
 * for Supabase on React Native), so a signed-in partner stays signed in across
 * launches. `detectSessionInUrl` is off because this is a native app: sign-in is
 * an emailed one-time code, not a redirect.
 *
 * The URL and publishable key are public by design. RLS is what keeps rows
 * private; the secret key must never reach the app.
 */
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
