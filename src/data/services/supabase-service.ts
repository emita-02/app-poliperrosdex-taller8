import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from './env';

// Service: envuelve una fuente de datos externa y nada más.
// No guarda estado ni transforma datos; eso le toca al repositorio.
//
// Con login, la sesión tiene que sobrevivir al cierre de la app y renovarse
// sola: por eso persistSession y autoRefreshToken pasan a true y la sesión
// se guarda en AsyncStorage. PKCE es el flujo recomendado para apps móviles.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// En móvil no hay pestaña "visible": renovamos el token solo mientras la
// app está en primer plano para no gastar batería ni red en segundo plano.
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}

export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}