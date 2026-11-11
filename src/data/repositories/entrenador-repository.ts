import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { Entrenador } from '@/domain/models/entrenador';

import { supabase } from '../services/supabase-service';

// Si Android deja abierta la ventana del navegador al volver a la app,
// esto la cierra.
WebBrowser.maybeCompleteAuthSession();

// Los demás entrenadores solo ven el primer nombre de la cuenta de Google.
// Es la misma regla que el trigger crear_entrenador() de la base de datos,
// así lo que ves de ti es igual a lo que ven los demás.
function aDominio(usuario: User): Entrenador {
  const completo = String(
    usuario.user_metadata?.full_name ?? usuario.user_metadata?.name ?? '',
  );
  const primerNombre = completo.trim().split(/\s+/)[0];
  return { id: usuario.id, nombre: primerNombre || 'Entrenador' };
}

export const entrenadorRepository = {
  // Avisa de la sesión actual al suscribirse y cada vez que cambia
  // (login, logout, token vencido). Devuelve la función para dejar de
  // escuchar. Ojo: dentro del callback no se hacen llamadas await a
  // supabase; la librería puede quedarse bloqueada.
  escucharSesion(alCambiar: (entrenador: Entrenador | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      alCambiar(sesion ? aDominio(sesion.user) : null);
    });
    return () => data.subscription.unsubscribe();
  },

  // Abre Google en el navegador del sistema y vuelve a la app por el
  // esquema "poliperrodex://". No devuelve nada: al terminar, Supabase
  // emite SIGNED_IN y escucharSesion lo recibe.
  async iniciarSesionConGoogle(): Promise<void> {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      throw new Error(`No se pudo iniciar con Google: ${error?.message ?? 'sin URL'}`);
    }

    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    // Si el usuario cierra la ventana no es un error: simplemente no entró.
    if (resultado.type !== 'success') return;

    const codigo = Linking.parse(resultado.url).queryParams?.code;
    if (typeof codigo !== 'string') {
      throw new Error('Google no devolvió el código de acceso. Inténtalo de nuevo.');
    }

    const { error: errorCanje } = await supabase.auth.exchangeCodeForSession(codigo);
    if (errorCanje) throw new Error(`No se pudo completar el acceso: ${errorCanje.message}`);
  },

  async cerrarSesion(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  },
};