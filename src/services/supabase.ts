import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** false quando o .env não foi preenchido: a UI de login avisa o programador. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn(
    '[Nutri IA] Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ficheiro .env.',
  );
}

// A anon key é pública por desenho: a segurança dos dados vem das políticas RLS (ver supabase/).
// Nunca coloque a service_role key na app.
export const supabase = createClient<Database>(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      // AsyncStorage guarda apenas a sessão de autenticação (tokens).
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Só renova o token enquanto a app está em primeiro plano (poupa dados e bateria).
AppState.addEventListener('change', (state) => {
  if (state === 'active') void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
