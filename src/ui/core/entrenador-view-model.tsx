import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { entrenadorRepository } from '@/data/repositories/entrenador-repository';
import type { Entrenador } from '@/domain/models/entrenador';

// Reemplaza a apodo-view-model. Sigue siendo un ViewModel compartido: la
// Pokédex, la captura y el perfil necesitan saber quién está jugando.
// No guarda nada por su cuenta: todo pasa por el repositorio.
type EstadoEntrenador = {
  entrenador: Entrenador | null;
  // false hasta que Supabase informa de la sesión guardada; evita mostrar
  // el login un instante y esconderlo enseguida.
  listo: boolean;
  // true mientras está abierta la ventana de Google.
  entrando: boolean;
  error: string | null;
  iniciarSesion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const EntrenadorContext = createContext<EstadoEntrenador | null>(null);

export function EntrenadorProvider({ children }: { children: ReactNode }) {
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null);
  const [listo, setListo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // escucharSesion devuelve la función para dejar de escuchar y React
    // la llama al desmontar.
    return entrenadorRepository.escucharSesion((actual) => {
      setEntrenador(actual);
      setListo(true);
    });
  }, []);

  async function iniciarSesion() {
    setEntrando(true);
    setError(null);
    try {
      await entrenadorRepository.iniciarSesionConGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setEntrando(false);
    }
  }

  async function cerrarSesion() {
    try {
      await entrenadorRepository.cerrarSesion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión');
    }
  }

  return (
    <EntrenadorContext.Provider
      value={{ entrenador, listo, entrando, error, iniciarSesion, cerrarSesion }}>
      {children}
    </EntrenadorContext.Provider>
  );
}

export function useEntrenador(): EstadoEntrenador {
  const valor = useContext(EntrenadorContext);
  if (!valor) throw new Error('useEntrenador debe usarse dentro de <EntrenadorProvider>');
  return valor;
}
